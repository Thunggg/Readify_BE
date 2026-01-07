/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';

import { Order, OrderDocument } from './schemas/order.schema';
import { SearchOrderDto } from './dto/search-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderSortBy, SortOrder } from './constants/order.enum';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import { Promotion, PromotionDocument } from '../promotion/schemas/promotion.schema';
import { PromotionLogService } from '../promotion-log/promotion-log.service';

import { PaginatedResponse } from '../../shared/responses/paginated.response';
import { SuccessResponse } from '../../shared/responses/success.response';

@Injectable()
export class OrderService {
  // 0: user, 1: admin, 2: seller, 3: warehouse, 4: staff, 5: seller
  private readonly ALLOWED_ROLES_VIEW_ALL = [1, 2, 3]; // Admin, Warehouse, Staff
  private readonly ALLOWED_ROLES_VIEW_DETAIL = [0, 1, 2, 3]; // Admin, Warehouse, Staff, Customer
  private readonly ALLOWED_ROLES_CREATE = [0]; //  Customer
  private readonly ALLOWED_ROLES_UPDATE = [1, 2, 3]; // Admin, Warehouse, Staff

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly promotionLogService: PromotionLogService,
  ) {}

  async getOrderList(query: SearchOrderDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_VIEW_ALL.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const {
      q,
      status,
      paymentMethod,
      paymentStatus,
      sortBy = OrderSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    const filter: any = {};

    if (status !== undefined) {
      filter.status = status;
    }

    if (paymentMethod !== undefined) {
      filter.paymentMethod = paymentMethod;
    }

    if (paymentStatus !== undefined) {
      filter.paymentStatus = paymentStatus;
    }

    if (q?.trim()) {
      const keyword = q.trim();
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedKeyword = escapeRegex(keyword);

      filter.$or = [
        { orderCode: { $regex: escapedKeyword, $options: 'i' } },
        { shippingAddress: { $regex: escapedKeyword, $options: 'i' } },
      ];
    }

    const sortMap: Record<string, any> = {
      createdAt: { createdAt: order === 'asc' ? 1 : -1 },
      updatedAt: { updatedAt: order === 'asc' ? 1 : -1 },
      totalAmount: { totalAmount: order === 'asc' ? 1 : -1 },
      finalAmount: { finalAmount: order === 'asc' ? 1 : -1 },
      orderCode: { orderCode: order === 'asc' ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .populate('userId', 'firstName lastName email phone')
        .populate('promotionId', 'code name discountType discountValue')
        .lean(),

      this.orderModel.countDocuments(filter),
    ]);

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Get orders list success',
    );
  }

  async getOrderDetail(orderId: string, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_VIEW_DETAIL.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('userId', 'firstName lastName email phone')
      .populate('promotionId', 'code name discountType discountValue')
      .lean();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role === 0) {
      if (order.userId._id.toString() !== currentUser) {
        throw new ForbiddenException('You can only view your own orders');
      }
    }

    return new SuccessResponse(order, 'Get order detail success');
  }

  async createOrder(createDto: CreateOrderDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_CREATE.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    if (!createDto.items || createDto.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    if (createDto.totalAmount <= 0 || createDto.finalAmount <= 0) {
      throw new BadRequestException('Invalid order amounts');
    }

    if (!createDto.shippingAddress || createDto.shippingAddress.trim().length < 10) {
      throw new BadRequestException('Shipping address must be at least 10 characters');
    }

    let orderUserId: Types.ObjectId;

    if (createDto.userId) {
      if (user.role === 0) {
        throw new ForbiddenException('Customer cannot create order for other users');
      }

      if (!Types.ObjectId.isValid(createDto.userId)) {
        throw new BadRequestException('Invalid userId');
      }

      const targetUser = await this.accountModel.findById(createDto.userId).lean();
      if (!targetUser) {
        throw new NotFoundException('Target user not found');
      }

      orderUserId = new Types.ObjectId(createDto.userId);
    } else {
      orderUserId = new Types.ObjectId(currentUser);
    }

    const items = createDto.items.map((item) => {
      if (!Types.ObjectId.isValid(item.bookId)) {
        throw new BadRequestException(`Invalid bookId: ${item.bookId}`);
      }

      if (item.quantity <= 0) {
        throw new BadRequestException(`Invalid quantity for ${item.title}`);
      }

      if (item.unitPrice < 0 || item.subtotal < 0) {
        throw new BadRequestException(`Invalid price for ${item.title}`);
      }

      if (item.subtotal !== item.quantity * item.unitPrice) {
        throw new BadRequestException(`Subtotal mismatch for ${item.title}`);
      }

      return {
        ...item,
        bookId: new Types.ObjectId(item.bookId),
      };
    });

    const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (calculatedTotal !== createDto.totalAmount) {
      throw new BadRequestException('Total amount does not match sum of items');
    }

    const expectedFinal = createDto.totalAmount - (createDto.discountAmount || 0);
    if (Math.abs(expectedFinal - createDto.finalAmount) > 1) {
      throw new BadRequestException('Final amount calculation is incorrect');
    }

    let promotionId: Types.ObjectId | undefined;
    if (createDto.promotionId) {
      if (!Types.ObjectId.isValid(createDto.promotionId)) {
        throw new BadRequestException('Invalid promotionId');
      }

      const promotion = await this.promotionModel.findById(createDto.promotionId).lean();
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

      if (createDto.totalAmount < promotion.minOrderValue) {
        throw new BadRequestException(`Minimum order value for this promotion is ${promotion.minOrderValue}`);
      }

      promotionId = new Types.ObjectId(createDto.promotionId);
    }

    const lastOrder = await this.orderModel.findOne().sort({ createdAt: -1 }).lean();
    let orderCode = 'ORD20250001';

    if (lastOrder && lastOrder.orderCode) {
      const lastNumber = parseInt(lastOrder.orderCode.replace('ORD', ''));
      const nextNumber = lastNumber + 1;
      orderCode = `ORD${nextNumber.toString().padStart(8, '0')}`;
    }

    const newOrder = await this.orderModel.create({
      orderCode,
      userId: orderUserId,
      items,
      status: 'CREATED',
      totalAmount: createDto.totalAmount,
      discountAmount: createDto.discountAmount || 0,
      finalAmount: createDto.finalAmount,
      promotionId,
      shippingAddress: createDto.shippingAddress,
      paymentMethod: createDto.paymentMethod,
      paymentStatus: 'UNPAID',
      note: createDto.note,
    });

    if (promotionId) {
      await this.promotionModel.findByIdAndUpdate(promotionId, {
        $inc: { usedCount: 1 },
      });

      const promotionData = await this.promotionModel.findById(promotionId).lean();
      if (promotionData) {
        await this.promotionLogService.createLog({
          promotionId: promotionId.toString(),
          promotionCode: promotionData.code,
          promotionName: promotionData.name,
          action: 'APPLY',
          performedBy: orderUserId.toString(),
          newData: {
            orderId: newOrder._id.toString(),
            orderCode: orderCode,
            discountAmount: createDto.discountAmount,
            finalAmount: createDto.finalAmount,
            totalAmount: createDto.totalAmount,
          },
          note: `Customer applied promotion ${promotionData.code} for order ${orderCode}`,
        });
      }
    }

    const order = await this.orderModel
      .findById(newOrder._id)
      .populate('userId', 'firstName lastName email phone')
      .populate('promotionId', 'code name discountType discountValue')
      .lean();

    return new SuccessResponse(order, 'Order created successfully');
  }

  async updateOrder(orderId: string, updateDto: UpdateOrderDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!this.ALLOWED_ROLES_UPDATE.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }

    const existingOrder = await this.orderModel.findById(orderId).lean();
    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }

    let promotionId: Types.ObjectId | undefined;
    if (updateDto.promotionId) {
      if (!Types.ObjectId.isValid(updateDto.promotionId)) {
        throw new BadRequestException('Invalid promotionId');
      }

      const promotion = await this.promotionModel.findById(updateDto.promotionId).lean();
      if (!promotion) {
        throw new NotFoundException('Promotion not found');
      }

      promotionId = new Types.ObjectId(updateDto.promotionId);

      if (existingOrder.promotionId?.toString() !== updateDto.promotionId) {
        if (existingOrder.promotionId) {
          await this.promotionModel.findByIdAndUpdate(existingOrder.promotionId, {
            $inc: { usedCount: -1 },
          });
        }

        await this.promotionModel.findByIdAndUpdate(promotionId, {
          $inc: { usedCount: 1 },
        });
      }
    }

    let items;
    if (updateDto.items) {
      items = updateDto.items.map((item) => {
        if (!Types.ObjectId.isValid(item.bookId)) {
          throw new BadRequestException(`Invalid bookId: ${item.bookId}`);
        }
        return {
          ...item,
          bookId: new Types.ObjectId(item.bookId),
        };
      });
    }

    const updateData: any = {
      ...updateDto,
    };

    if (items) {
      updateData.items = items;
    }

    if (promotionId) {
      updateData.promotionId = promotionId;
    }

    delete updateData.userId;

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(orderId, updateData, { new: true })
      .populate('userId', 'firstName lastName email phone')
      .populate('promotionId', 'code name discountType discountValue')
      .lean();

    return new SuccessResponse(updatedOrder, 'Order updated successfully');
  }

  async getOrderHistory(query: SearchOrderDto, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role !== 0) {
      throw new ForbiddenException('Only customers can view order history');
    }

    const {
      q,
      status,
      paymentMethod,
      paymentStatus,
      sortBy = OrderSortBy.CREATED_AT,
      order = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    const filter: any = {
      userId: new Types.ObjectId(currentUser),
    };

    if (status !== undefined) {
      filter.status = status;
    }

    if (paymentMethod !== undefined) {
      filter.paymentMethod = paymentMethod;
    }

    if (paymentStatus !== undefined) {
      filter.paymentStatus = paymentStatus;
    }

    if (q?.trim()) {
      const keyword = q.trim();
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedKeyword = escapeRegex(keyword);

      filter.$or = [
        { orderCode: { $regex: escapedKeyword, $options: 'i' } },
        { shippingAddress: { $regex: escapedKeyword, $options: 'i' } },
      ];
    }

    const sortMap: Record<string, any> = {
      createdAt: { createdAt: order === 'asc' ? 1 : -1 },
      updatedAt: { updatedAt: order === 'asc' ? 1 : -1 },
      totalAmount: { totalAmount: order === 'asc' ? 1 : -1 },
      finalAmount: { finalAmount: order === 'asc' ? 1 : -1 },
      orderCode: { orderCode: order === 'asc' ? 1 : -1 },
    };

    const sort = {
      ...(sortMap[sortBy] ?? { createdAt: -1 }),
      _id: 1,
    };

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(validLimit)
        .populate('promotionId', 'code name discountType discountValue')
        .lean(),

      this.orderModel.countDocuments(filter),
    ]);

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total,
      },
      'Get order history success',
    );
  }

  async cancelOrder(orderId: string, currentUser: string) {
    if (!Types.ObjectId.isValid(currentUser)) {
      throw new BadRequestException('Invalid user id');
    }

    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    const user = await this.accountModel.findById(currentUser).select('role').lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role !== 0) {
      throw new ForbiddenException('Only customers can cancel orders');
    }

    const order = await this.orderModel.findById(orderId).lean();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId.toString() !== currentUser) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === 'DELIVERED' || order.status === 'RECEIVED') {
      throw new BadRequestException('Cannot cancel order that has been delivered or received');
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('Cannot cancel order that has been paid. Please contact support for refund');
    }

    const cancelledOrder = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          status: 'CANCELLED',
          paymentStatus: order.paymentStatus === 'UNPAID' ? 'UNPAID' : 'REFUNDED',
        },
        { new: true },
      )
      .populate('userId', 'firstName lastName email phone')
      .populate('promotionId', 'code name discountType discountValue')
      .lean();

    const stockCollection = this.connection.db?.collection('stocks');
    if (!stockCollection) {
      throw new BadRequestException('Database connection error');
    }
    for (const item of order.items) {
      await stockCollection.updateOne(
        { bookId: new Types.ObjectId(item.bookId as any) },
        { $inc: { quantity: item.quantity } },
      );
    }

    if (order.promotionId) {
      await this.promotionModel.findByIdAndUpdate(order.promotionId, {
        $inc: { usedCount: -1 },
      });
    }

    return new SuccessResponse(cancelledOrder, 'Order cancelled successfully');
  }
}
