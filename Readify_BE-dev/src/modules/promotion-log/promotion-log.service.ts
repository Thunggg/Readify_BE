/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { PromotionLog, PromotionLogDocument } from './schemas/promotion-log.schema';
import { SearchPromotionLogDto } from './dto/search-promotion-log.dto';
import { PromotionLogSortBy, SortOrder } from './constants/promotion-log.enum';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';

import { PaginatedResponse } from '../../shared/responses/paginated.response';
import { SuccessResponse } from '../../shared/responses/success.response';

@Injectable()
export class PromotionLogService {
  private readonly ALLOWED_ROLES_VIEW = [1];

  constructor(
    @InjectModel(PromotionLog.name)
    private readonly promotionLogModel: Model<PromotionLogDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  async getPromotionLogs(query: SearchPromotionLogDto, currentUser: string) {
    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_VIEW.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to view promotion logs');
    }

    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { promotionCode: { $regex: query.search, $options: 'i' } },
        { promotionName: { $regex: query.search, $options: 'i' } },
        { note: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.promotionId) {
      if (!Types.ObjectId.isValid(query.promotionId)) {
        throw new BadRequestException('Invalid promotion id');
      }
      filter.promotionId = new Types.ObjectId(query.promotionId);
    }

    if (query.promotionCode) {
      filter.promotionCode = { $regex: query.promotionCode, $options: 'i' };
    }

    if (query.action) {
      filter.action = query.action;
    }

    if (query.performedBy) {
      if (!Types.ObjectId.isValid(query.performedBy)) {
        throw new BadRequestException('Invalid user id');
      }
      filter.performedBy = new Types.ObjectId(query.performedBy);
    }

    if (query.fromDate || query.toDate) {
      filter.createdAt = {};
      if (query.fromDate) {
        filter.createdAt.$gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        filter.createdAt.$lte = new Date(query.toDate);
      }
    }

    const sortBy = query.sortBy || PromotionLogSortBy.CREATED_AT;
    const order = query.order || SortOrder.DESC;
    const sort: any = {};
    sort[sortBy] = order === SortOrder.ASC ? 1 : -1;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.promotionLogModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('promotionId', 'code name status')
        .populate('performedBy', 'firstName lastName email role')
        .lean(),
      this.promotionLogModel.countDocuments(filter),
    ]);

    return new PaginatedResponse(
      logs,
      { total, page, limit },
      'Promotion logs retrieved successfully',
    );
  }

  async getPromotionLogDetail(logId: string, currentUser: string) {
    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_VIEW.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to view promotion logs');
    }

    if (!Types.ObjectId.isValid(logId)) {
      throw new BadRequestException('Invalid log id');
    }

    const log = await this.promotionLogModel
      .findById(logId)
      .populate('promotionId', 'code name status discountType discountValue')
      .populate('performedBy', 'firstName lastName email role')
      .lean();

    if (!log) {
      throw new NotFoundException('Promotion log not found');
    }

    return new SuccessResponse(log, 'Promotion log retrieved successfully');
  }

  async createLog(data: {
    promotionId: string;
    promotionCode: string;
    promotionName: string;
    action: string;
    performedBy: string;
    oldData?: Record<string, any>;
    newData?: Record<string, any>;
    changes?: Record<string, any>;
    note?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const log = new this.promotionLogModel(data);
    await log.save();
    return log;
  }
}
