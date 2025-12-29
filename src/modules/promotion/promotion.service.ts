/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Promotion, PromotionDocument } from './schemas/promotion.schema';
import { SearchPromotionDto } from './dto/search-promotion.dto';
import { PromotionSortBy, SortOrder } from './constants/promotion.enum';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';

import { ApiResponse } from '../../shared/responses/api-response';

@Injectable()
export class PromotionService {
  private readonly ALLOWED_ROLES = [0, 1, 2, 3];

  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  async getPromotionList(query: SearchPromotionDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES.includes(user.role)) {
      throw new ForbiddenException('Show message access denied');
    }

    const {
      q,
      status,
      discountType,
      applyScope,
      sortBy = PromotionSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    const filter: any = {
      // isDeleted: false,
    };

    if (status !== undefined) {
      filter.status = status;
    }

    if (discountType !== undefined) {
      filter.discountType = discountType;
    }

    if (applyScope !== undefined) {
      filter.applyScope = applyScope;
    }

    if (q?.trim()) {
      const keyword = q.trim();
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedKeyword = escapeRegex(keyword);

      filter.$or = [
        { code: { $regex: escapedKeyword, $options: 'i' } },
        { name: { $regex: escapedKeyword, $options: 'i' } },
      ];
    }

    const sortMap: Record<string, any> = {
      createdAt: { createdAt: order === 'asc' ? 1 : -1 },
      startDate: { startDate: order === 'asc' ? 1 : -1 },
      endDate: { endDate: order === 'asc' ? 1 : -1 },
      discountValue: { discountValue: order === 'asc' ? 1 : -1 },
      usageLimit: { usageLimit: order === 'asc' ? 1 : -1 },
      usedCount: { usedCount: order === 'asc' ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    const [items, total] = await Promise.all([
      this.promotionModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .lean(),

      this.promotionModel.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Get promotions list success',
    );
  }
}
