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
import { PromotionSortBy, SortOrder } from './constants/promotion.enum';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';

import { ApiResponse } from '../../shared/responses/api-response';

@Injectable()
export class PromotionService {
  private readonly ALLOWED_ROLES = [0, 1, 4, 3, 2]; // 0: user, 1: admin, 2: seller, 3: warehouse, 4: staff, 5: seller
  private readonly ALLOWED_ROLES_M = [4, 2, 3]; // Admin, Warehouse, Seller
  private readonly ALLOWED_ROLES_MUTATE = [4, 3, 2]; // Admin, Warehouse, Seller
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

    return ApiResponse.success(promotion, 'Get promotion detail success');
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
      status: 'ACTIVE',
    });

    const promotion = await this.promotionModel
      .findById(newPromotion._id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    return ApiResponse.success(promotion, 'Promotion created successfully');
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

    if (updateDto.code && updateDto.code.toUpperCase() !== existingPromotion.code) {
      const codeExists = await this.promotionModel
        .findOne({
          code: updateDto.code.toUpperCase(),
          _id: { $ne: promotionId },
        })
        .lean();

      if (codeExists) {
        throw new ConflictException('Promotion code already exists');
      }
    }

    if (updateDto.startDate || updateDto.endDate) {
      const startDate = updateDto.startDate ? new Date(updateDto.startDate) : existingPromotion.startDate;
      const endDate = updateDto.endDate ? new Date(updateDto.endDate) : existingPromotion.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    if (updateDto.discountValue !== undefined) {
      const discountType = updateDto.discountType || existingPromotion.discountType;
      if (discountType === 'PERCENT' && updateDto.discountValue > 100) {
        throw new BadRequestException('Discount percentage cannot exceed 100%');
      }
    }

    const updateData: any = {
      ...updateDto,
      updatedBy: new Types.ObjectId(currentUser),
    };

    if (updateDto.code) {
      updateData.code = updateDto.code.toUpperCase();
    }

    const updatedPromotion = await this.promotionModel
      .findByIdAndUpdate(promotionId, updateData, { new: true })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .lean();

    return ApiResponse.success(updatedPromotion, 'Promotion updated successfully');
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

    await this.promotionModel.findByIdAndDelete(promotionId);

    return ApiResponse.success(null, 'Promotion deleted successfully');
  }

  async applyPromotion(applyDto: ApplyPromotionDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role !== 0) {
      throw new ForbiddenException('Only customers can apply promotions');
    }

    const promotion = await this.promotionModel
      .findOne({
        code: applyDto.code.toUpperCase(),
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

    return ApiResponse.success(
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
