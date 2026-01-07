/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Promotion, PromotionDocument } from './schemas/promotion.schema';
import { SearchPromotionDto } from './dto/search-promotion.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ApplyPromotionDto } from './dto/apply-promotion.dto';
import { PromotionSortBy, PromotionStatus, SortOrder } from './constants/promotion.enum';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';

import { PaginatedResponse } from '../../shared/responses/paginated.response';
import { SuccessResponse } from '../../shared/responses/success.response';

@Injectable()
export class PromotionService {
  private readonly ALLOWED_ROLES = [0, 1, 2, 3]; // 0: user, 1: admin, 2: seller, 3: warehouse manager
  private readonly ALLOWED_ROLES_M = [1, 3, 2]; // Admin, Warehouse, Seller
  private readonly ALLOWED_ROLES_MUTATE = [1, 3, 2]; // Admin, Warehouse, Seller
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
      throw new ForbiddenException('Access denied');
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

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Get promotions list success',
    );
  }

  async getPromotionDetail(promotionId: string, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(promotionId)) {
      throw new BadRequestException('Invalid promotion id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_M.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const promotion = await this.promotionModel
      .findById(promotionId)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return new SuccessResponse(promotion, 'Get promotion detail success');
  }

  async createPromotion(createDto: CreatePromotionDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_MUTATE.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const existingPromotion = await this.promotionModel
      .findOne({
        code: createDto.code.toUpperCase(),
      })
      .lean();

    if (existingPromotion) {
      throw new ConflictException('Promotion code already exists');
    }

    const startDate = new Date(createDto.startDate);
    const endDate = new Date(createDto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (createDto.discountType === 'PERCENT' && createDto.discountValue > 100) {
      throw new BadRequestException('Discount percentage cannot exceed 100%');
    }

    const newPromotion = await this.promotionModel.create({
      ...createDto,
      code: createDto.code.toUpperCase(),
      createdBy: new Types.ObjectId(currentUser),
      status: 'INACTIVE',
    });

    const promotion = await this.promotionModel
      .findById(newPromotion._id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    return new SuccessResponse(promotion, 'Promotion created successfully');
  }

  async updatePromotion(promotionId: string, updateDto: UpdatePromotionDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(promotionId)) {
      throw new BadRequestException('Invalid promotion id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_MUTATE.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const existingPromotion = await this.promotionModel.findById(promotionId).lean();
    if (!existingPromotion) {
      throw new NotFoundException('Promotion not found');
    }

    const now = new Date();

    // hệ thống tự động set status expired khi endDate < now
    if (now > new Date(existingPromotion.endDate)) {
      await this.promotionModel.updateOne({ _id: promotionId }, { $set: { status: PromotionStatus.EXPIRED } });
      throw new BadRequestException('Promotion has expired');
    }

    // CODE: do not allow changing promo code after creation (it breaks user expectations/history)
    if (updateDto.code && updateDto.code.toUpperCase() !== existingPromotion.code) {
      throw new BadRequestException('Cannot change promotion code');
    }

    // START DATE: do not allow changing startDate after creation (history/validity issues)
    if (
      updateDto.startDate &&
      new Date(updateDto.startDate).getTime() !== new Date(existingPromotion.startDate).getTime()
    ) {
      throw new BadRequestException('Cannot change promotion start date');
    }

    // If promotion is ACTIVE, already started, or has been used -> lock key commercial fields
    const isRunningOrStarted =
      existingPromotion.status === PromotionStatus.ACTIVE || now >= new Date(existingPromotion.startDate);
    const isUsed = (existingPromotion.usedCount ?? 0) > 0;
    if (isRunningOrStarted || isUsed) {
      if (updateDto.discountType !== undefined && updateDto.discountType !== existingPromotion.discountType) {
        throw new BadRequestException('Cannot change discount type while promotion is running/started/used');
      }

      if (updateDto.discountValue !== undefined && updateDto.discountValue !== existingPromotion.discountValue) {
        throw new BadRequestException('Cannot change discount value while promotion is running/started/used');
      }

      if (updateDto.minOrderValue !== undefined && updateDto.minOrderValue !== existingPromotion.minOrderValue) {
        throw new BadRequestException('Cannot change minimum order value while promotion is running/started/used');
      }

      if (updateDto.maxDiscount !== undefined && updateDto.maxDiscount !== existingPromotion.maxDiscount) {
        throw new BadRequestException('Cannot change max discount while promotion is running/started/used');
      }
    }

    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate ? new Date(updateDto.startDate) : existingPromotion.startDate;
      const endDate = updateDto.endDate ? new Date(updateDto.endDate) : existingPromotion.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Validate the final (discountType, discountValue) after applying updates
    // - If discountType becomes PERCENT, the effective discountValue must be <= 100
    {
      const finalDiscountType = updateDto.discountType ?? existingPromotion.discountType;
      const finalDiscountValue = updateDto.discountValue ?? existingPromotion.discountValue;

      if (finalDiscountType === 'PERCENT' && finalDiscountValue > 100) {
        throw new BadRequestException('Discount percentage cannot exceed 100%');
      }
    }

    const updateData: any = {
      ...updateDto,
      updatedBy: new Types.ObjectId(currentUser),
    };

    // Do not update code (immutable); if provided and same, ignore it
    if (updateDto.code) delete updateData.code;

    const updatedPromotion = await this.promotionModel
      .findByIdAndUpdate(promotionId, updateData, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean();

    return new SuccessResponse(updatedPromotion, 'Promotion updated successfully');
  }

  async deletePromotion(promotionId: string, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(promotionId)) {
      throw new BadRequestException('Invalid promotion id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_MUTATE.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const promotion = await this.promotionModel.findById(promotionId).lean();
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.usedCount > 0) {
      throw new BadRequestException('Cannot delete promotion that has been used');
    }

    await this.promotionModel.updateOne({ _id: promotionId }, { $set: { isDeleted: true } });

    return new SuccessResponse(null, 'Promotion deleted successfully');
  }

  async applyPromotion(applyDto: ApplyPromotionDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.accountModel.findById(currentUser).select('role status').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role !== 0) {
      throw new ForbiddenException('Only customers can apply promotions');
    }

    if (user.status !== 1) {
      throw new ForbiddenException('Your account is not active');
    }

    const promotion = await this.promotionModel
      .findOne({
        code: applyDto.code.toUpperCase(),
        isDeleted: false,
      })
      .lean();

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion.status !== 'ACTIVE') {
      throw new BadRequestException('Promotion is not active');
    }

    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (now < startDate) {
      throw new BadRequestException('Promotion has not started yet');
    }

    if (now > endDate) {
      throw new BadRequestException('Promotion has expired');
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Promotion usage limit has been reached');
    }

    if (applyDto.orderValue < promotion.minOrderValue) {
      throw new BadRequestException(`Minimum order value is ${promotion.minOrderValue}`);
    }

    let discountAmount = 0;

    if (promotion.discountType === 'PERCENT') {
      discountAmount = (applyDto.orderValue * promotion.discountValue) / 100;

      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
        discountAmount = promotion.maxDiscount;
      }
    } else if (promotion.discountType === 'FIXED') {
      discountAmount = promotion.discountValue;
    }

    if (discountAmount > applyDto.orderValue) {
      discountAmount = applyDto.orderValue;
    }

    const finalAmount = applyDto.orderValue - discountAmount;

    await this.promotionModel.updateOne({ _id: promotion._id }, { $inc: { usedCount: 1 } });

    return new SuccessResponse(
      {
        promotionCode: promotion.code,
        promotionName: promotion.name,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        orderValue: applyDto.orderValue,
        discountAmount: Math.round(discountAmount),
        finalAmount: Math.round(finalAmount),
        savedAmount: Math.round(discountAmount),
      },
      'Promotion applied successfully',
    );
  }
}
