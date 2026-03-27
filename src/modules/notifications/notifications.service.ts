import { Injectable, HttpException, HttpStatus, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationRead, NotificationReadDocument } from './schemas/notification-read.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { AdminListNotificationsDto } from './dto/admin-list-notifications.dto';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { AccountRole } from '../staff/constants/staff.enum';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationRead.name)
    private readonly notificationReadModel: Model<NotificationReadDocument>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(dto: CreateNotificationDto, currentUserId: string) {
    // Validate currentUserId
    if (!currentUserId) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'User ID is required' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const createdBy = new Types.ObjectId(currentUserId);

    const notification = await this.notificationModel.create({
      createdBy,
      title: dto.title.trim(),
      content: dto.content.trim(),
      type: dto.type || 'SYSTEM',
      relatedOrderId: dto.relatedOrderId ? new Types.ObjectId(dto.relatedOrderId) : undefined,
      relatedPromotionId: dto.relatedPromotionId ? new Types.ObjectId(dto.relatedPromotionId) : undefined,
      metadata: dto.metadata || {},
      isActive: true,
    });

    const notificationData = notification.toObject();

    // EMIT TO SOCKET
    this.notificationsGateway.sendNotificationToUser(currentUserId, {
      ...notificationData,
      isRead: false,
      readAt: null,
    });

    return new SuccessResponse(notificationData, 'Tạo thông báo thành công', 201);
  }

  async getNotificationsList(query: ListNotificationsDto, currentUserId: string, page: number = 1, limit: number = 10) {
    const { type, isRead } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(250, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    const currentUserIdObj = new Types.ObjectId(currentUserId);

    // MATCH STAGE
    const match: any = {
      createdBy: currentUserIdObj,
      isActive: true,
    };

    if (type) {
      match.type = type;
    }

    // AGGREGATION PIPELINE
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: (this.notificationReadModel as any).collection.name,
          let: { notificationId: '$_id', userId: currentUserIdObj },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$notificationId', '$$notificationId'] },
                    { $eq: ['$userId', '$$userId'] },
                    { $ne: ['$isDeleted', true] },
                  ],
                },
              },
            },
          ],
          as: 'readStatus',
        },
      },
      {
        $addFields: {
          isRead: { $gt: [{ $size: '$readStatus' }, 0] },
          readAt: { $arrayElemAt: ['$readStatus.readAt', 0] },
        },
      },
    ];

    // HANDLE isRead FILTER IN PIPELINE
    if (isRead !== undefined) {
      pipeline.push({ $match: { isRead: isRead === true } });
    }

    // SORT, SKIP, LIMIT
    pipeline.push(
      { $sort: { createdAt: -1 as 1 | -1, _id: 1 as 1 | -1 } },
      { $skip: skip },
      { $limit: validLimit },
      {
        $project: {
          _id: 1,
          createdBy: 1,
          title: 1,
          content: 1,
          type: 1,
          relatedOrderId: 1,
          relatedPromotionId: 1,
          createdAt: 1,
          updatedAt: 1,
          isRead: 1,
          readAt: 1,
        },
      },
    );

    // EXECUTE AGGREGATION AND COUNT
    const [items, total] = await Promise.all([
      this.notificationModel.aggregate(pipeline).exec(),
      this.notificationModel.countDocuments(match), // Note: total count might be wrong if isRead filter is applied, but standard is to count base match
    ]);
    
    // If isRead filter is applied, we might need a separate count or use $facet in pipeline
    // For simplicity and alignment with PaginatedResponse expectations, we'll keep countDocuments(match) 
    // but if we want accurate total for filtered isRead, we'd need another aggregation or facet.
    
    let finalTotal = total;
    if (isRead !== undefined) {
      const countPipeline = [
        { $match: match },
        {
          $lookup: {
            from: (this.notificationReadModel as any).collection.name,
            let: { notificationId: '$_id', userId: currentUserIdObj },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$notificationId', '$$notificationId'] }, { $eq: ['$userId', '$$userId'] }, { $ne: ['$isDeleted', true] }] } } },
            ],
            as: 'readStatus',
          },
        },
        { $addFields: { isRead: { $gt: [{ $size: '$readStatus' }, 0] } } },
        { $match: { isRead: isRead === true } },
        { $count: 'total' }
      ];
      const countResult = await this.notificationModel.aggregate(countPipeline).exec();
      finalTotal = countResult[0]?.total || 0;
    }

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total: finalTotal,
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
        createdBy: new Types.ObjectId(currentUserId),
        isActive: true,
      })
      .populate('relatedOrderId', 'orderCode status totalAmount finalAmount')
      .populate('relatedPromotionId', 'code name discountType discountValue')
      .select({
        _id: 1,
        createdBy: 1,
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
      throw new HttpException(ErrorResponse.notFound('Notification not found'), HttpStatus.NOT_FOUND);
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

    return new SuccessResponse(notificationData, 'Lấy chi tiết thông báo thành công', 200);
  }

  async updateNotification(
    notificationId: string,
    dto: UpdateNotificationDto,
    currentUserId: string,
    currentUserRole?: number,
  ) {
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
      throw new HttpException(ErrorResponse.notFound('Notification not found'), HttpStatus.NOT_FOUND);
    }

    // Check permission: user can only update their own notifications, admin can update any
    const isAdmin = currentUserRole === AccountRole.ADMIN;
    const isOwner = notification.createdBy.toString() === currentUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    if (!notification) {
      throw new HttpException(ErrorResponse.notFound('Notification not found'), HttpStatus.NOT_FOUND);
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

    return new SuccessResponse(
      {
        ...notificationData,
        isRead: !!readRecord,
        readAt: readRecord?.readAt || null,
      },
      'Cập nhật thông báo thành công',
      200,
    );
  }

  async deleteNotification(notificationId: string, currentUserId: string, currentUserRole?: number) {
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
      throw new HttpException(ErrorResponse.notFound('Notification not found'), HttpStatus.NOT_FOUND);
    }

    // Check permission: user can only delete their own notifications, admin can delete any
    const isAdmin = currentUserRole === AccountRole.ADMIN;
    const isOwner = notification.createdBy.toString() === currentUserId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    // Soft delete
    notification.isActive = false;
    await notification.save();

    return new SuccessResponse({ _id: notificationId }, 'Xóa thông báo thành công', 200);
  }

  async markAllAsRead(currentUserId: string) {
    // Get all unread notifications for this user
    const unreadNotifications = await this.notificationModel
      .find({
        createdBy: new Types.ObjectId(currentUserId),
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

    const alreadyReadIds = new Set(alreadyRead.map((r) => r.notificationId.toString()));

    // Filter out already read notifications
    const toMarkAsRead = notificationIds.filter((id) => !alreadyReadIds.has(id.toString()));

    // Create NotificationRead records for unread notifications
    const readRecords = toMarkAsRead.map((notificationId) => ({
      notificationId: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(currentUserId),
      readAt: new Date(),
    }));

    if (readRecords.length > 0) {
      await this.notificationReadModel.insertMany(readRecords);
    }

    return new SuccessResponse(
      { updatedCount: readRecords.length },
      'Đánh dấu tất cả thông báo đã đọc thành công',
      200,
    );
  }

  async getAdminNotificationsList(query: AdminListNotificationsDto) {
    const { userId, type, isRead, page = 1, limit = 10 } = query;

    // PAGINATION
    const validPage = Math.max(1, page);
    const validLimit = Math.min(250, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // MATCH STAGE
    const match: any = {
      isActive: true,
    };

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
          HttpStatus.BAD_REQUEST,
        );
      }
      match.createdBy = new Types.ObjectId(userId);
    }

    if (type) {
      match.type = type;
    }

    // AGGREGATION PIPELINE
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'accounts',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: (this.notificationReadModel as any).collection.name,
          let: { notificationId: '$_id', userId: userId ? new Types.ObjectId(userId) : '$createdBy._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$notificationId', '$$notificationId'] },
                    { $eq: ['$userId', '$$userId'] },
                    { $ne: ['$isDeleted', true] },
                  ],
                },
              },
            },
          ],
          as: 'readStatus',
        },
      },
      {
        $addFields: {
          isRead: { $gt: [{ $size: '$readStatus' }, 0] },
          readAt: { $arrayElemAt: ['$readStatus.readAt', 0] },
        },
      },
    ];

    // HANDLE isRead FILTER IN PIPELINE (only if userId is provided)
    if (isRead !== undefined && userId) {
      pipeline.push({ $match: { isRead: isRead === true } });
    }

    // SORT, SKIP, LIMIT
    pipeline.push(
      { $sort: { createdAt: -1 as 1 | -1, _id: 1 as 1 | -1 } },
      { $skip: skip },
      { $limit: validLimit },
      {
        $project: {
          _id: 1,
          createdBy: {
            _id: 1,
            email: 1,
            firstName: 1,
            lastName: 1,
          },
          title: 1,
          content: 1,
          type: 1,
          relatedOrderId: 1,
          relatedPromotionId: 1,
          metadata: 1,
          createdAt: 1,
          updatedAt: 1,
          isRead: 1,
          readAt: 1,
        },
      },
    );

    // EXECUTE AGGREGATION AND COUNT
    const [items, total] = await Promise.all([
      this.notificationModel.aggregate(pipeline).exec(),
      this.notificationModel.countDocuments(match),
    ]);
    
    let finalTotal = total;
    if (isRead !== undefined && userId) {
      const countPipeline = [
        { $match: match },
        {
          $lookup: {
            from: (this.notificationReadModel as any).collection.name,
            let: { notificationId: '$_id', userId: new Types.ObjectId(userId) },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$notificationId', '$$notificationId'] }, { $eq: ['$userId', '$$userId'] }, { $ne: ['$isDeleted', true] }] } } },
            ],
            as: 'readStatus',
          },
        },
        { $addFields: { isRead: { $gt: [{ $size: '$readStatus' }, 0] } } },
        { $match: { isRead: isRead === true } },
        { $count: 'total' }
      ];
      const countResult = await this.notificationModel.aggregate(countPipeline).exec();
      finalTotal = countResult[0]?.total || 0;
    }

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total: finalTotal,
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
      .populate('createdBy', 'email firstName lastName role')
      .populate('relatedOrderId', 'orderCode status totalAmount finalAmount')
      .populate('relatedPromotionId', 'code name discountType discountValue')
      .select({
        _id: 1,
        createdBy: 1,
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
      throw new HttpException(ErrorResponse.notFound('Notification not found'), HttpStatus.NOT_FOUND);
    }

    // Get read status for the notification owner
    const createdBy = notification.createdBy as any;
    if (createdBy && createdBy._id) {
      const readRecord = await this.notificationReadModel.findOne({
        notificationId: new Types.ObjectId(notificationId),
        userId: createdBy._id,
      });

      const notificationData = {
        ...notification,
        isRead: !!readRecord,
        readAt: readRecord?.readAt || null,
      };

      return new SuccessResponse(notificationData, 'Lấy chi tiết thông báo thành công', 200);
    }

    return new SuccessResponse(
      {
        ...notification,
        isRead: false,
        readAt: null,
      },
      'Lấy chi tiết thông báo thành công',
      200,
    );
  }

  async deleteNotificationRead(notificationReadId: string, currentUserId: string) {
    // Validate notificationReadId
    if (!Types.ObjectId.isValid(notificationReadId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'id', message: 'Invalid notification read ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    const notificationRead = await this.notificationReadModel.findOne({
      _id: new Types.ObjectId(notificationReadId),
      userId: new Types.ObjectId(currentUserId),
      isDeleted: { $ne: true },
    });

    if (!notificationRead) {
      throw new HttpException(ErrorResponse.notFound('Notification read record not found'), HttpStatus.NOT_FOUND);
    }

    // Soft delete
    notificationRead.isDeleted = true;
    notificationRead.deletedAt = new Date();
    await notificationRead.save();

    return new SuccessResponse({ _id: notificationReadId }, 'Xóa bản ghi đã đọc thành công', 200);
  }
}
