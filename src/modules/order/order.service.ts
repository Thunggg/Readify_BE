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
import { Cart, CartDocument } from '../cart/schemas/cart.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { Stock, StockDocument } from '../stock/schemas/stock.schema';
import { PromotionLogService } from '../promotion-log/promotion-log.service';

import { ApiResponse } from '../../shared/responses/api-response';

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
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    @InjectModel(Stock.name)
    private readonly stockModel: Model<StockDocument>,
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

    return ApiResponse.paginated(
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

    return ApiResponse.success(order, 'Get order detail success');
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

    const currentStatus = existingOrder.status;
    const updateData: any = {};

    if (updateDto.shippingAddress !== undefined) {
      if (currentStatus !== 'PENDING') {
        throw new BadRequestException('Shipping address can only be updated when order status is PENDING');
      }
      updateData.shippingAddress = updateDto.shippingAddress;
    }

    if (updateDto.status !== undefined && updateDto.status !== currentStatus) {
      if (existingOrder.paymentMethod === 'COD') {
        const statusOrder = ['PENDING', 'CONFIRMED', 'DELIVERED', 'COMPLETED'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const newIndex = statusOrder.indexOf(updateDto.status);

        if (updateDto.status === 'CANCELLED') {
          if (currentStatus === 'COMPLETED') {
            throw new BadRequestException('Cannot cancel completed order');
          }
          updateData.status = 'CANCELLED';
        } else if (currentStatus === 'CANCELLED') {
          throw new BadRequestException('Cannot change status of cancelled order');
        } else if (currentIndex === -1 || newIndex === -1) {
          throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${updateDto.status}`);
        } else if (newIndex !== currentIndex + 1) {
          throw new BadRequestException(
            `Invalid status transition. COD orders must follow sequence: PENDING → CONFIRMED → DELIVERED → COMPLETED. Cannot change from ${currentStatus} to ${updateDto.status}`,
          );
        } else {
          updateData.status = updateDto.status;
        }
      } else {
        updateData.status = updateDto.status;
      }
    }

    const allowedFields = ['shippingAddress', 'status'];
    const requestedFields = Object.keys(updateDto);
    const invalidFields = requestedFields.filter((field) => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Only shippingAddress and status can be updated. Invalid fields: ${invalidFields.join(', ')}`,
      );
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No valid fields to update');
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(orderId, updateData, { new: true })
      .populate('userId', 'firstName lastName email phone')
      .populate('promotionId', 'code name discountType discountValue')
      .lean();

    return ApiResponse.success(updatedOrder, 'Order updated successfully');
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

    return ApiResponse.paginated(
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

    if (order.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel order that has been delivered or received');
    }

    if (order.paymentMethod === 'COD') {
      if (order.status !== 'PENDING') {
        throw new BadRequestException('COD orders can only be cancelled when status is PENDING');
      }
    } else if (order.paymentMethod === 'VNPAY') {
      if (order.paymentStatus === 'PAID') {
        throw new BadRequestException(
          'Cannot cancel VNPAY order that has been paid. Please contact support for refund',
        );
      }
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const cancelledOrder = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          {
            status: 'CANCELLED',
            paymentStatus: order.paymentStatus === 'UNPAID' ? 'UNPAID' : undefined,
          },
          { new: true, session },
        )
        .populate('userId', 'firstName lastName email phone')
        .populate('promotionId', 'code name discountType discountValue')
        .lean();

      if (!cancelledOrder) {
        throw new BadRequestException('Failed to cancel order');
      }

      const stockCollection = this.connection.db?.collection('stocks');
      if (!stockCollection) {
        throw new BadRequestException('Database connection error');
      }

      for (const item of order.items) {
        const result = await stockCollection.updateOne(
          { bookId: new Types.ObjectId(item.bookId as any) },
          { $inc: { quantity: item.quantity } },
          { session },
        );

        if (result.matchedCount === 0) {
          throw new BadRequestException(`Stock not found for book ${item.bookId.toString()}`);
        }
      }

      if (order.promotionId) {
        const promotionResult = await this.promotionModel.findByIdAndUpdate(
          order.promotionId,
          {
            $inc: { usedCount: -1 },
            $pull: { usedByUsers: order.userId },
          },
          { session },
        );

        if (!promotionResult) {
          throw new BadRequestException('Failed to update promotion usage');
        }
      }

      await session.commitTransaction();

      return ApiResponse.success(cancelledOrder, 'Order cancelled successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
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

    if (!createDto.selectedCartItemIds || createDto.selectedCartItemIds.length === 0) {
      throw new BadRequestException('Must select at least one item from cart');
    }

    for (const cartItemId of createDto.selectedCartItemIds) {
      if (!Types.ObjectId.isValid(cartItemId)) {
        throw new BadRequestException(`Invalid cart item ID: ${cartItemId}`);
      }
    }

    if (!createDto.shippingAddress || createDto.shippingAddress.trim().length < 10) {
      throw new BadRequestException('Shipping address must be at least 10 characters');
    }

    const orderUserId = new Types.ObjectId(currentUser);

    const cartItems = await this.cartModel
      .find({
        _id: { $in: createDto.selectedCartItemIds.map((id) => new Types.ObjectId(id)) },
        userId: orderUserId,
      })
      .lean();

    if (cartItems.length === 0) {
      throw new BadRequestException('No valid cart items found');
    }

    if (cartItems.length !== createDto.selectedCartItemIds.length) {
      throw new BadRequestException('Some cart items not found or do not belong to you');
    }

    const bookIds = cartItems.map((item) => item.bookId);

    const stocks = await this.stockModel.find({ bookId: { $in: bookIds } }).lean();

    if (stocks.length !== bookIds.length) {
      throw new BadRequestException('Some books not found in stock');
    }

    const stockMap = new Map(stocks.map((stock) => [stock.bookId.toString(), stock]));

    const items = cartItems.map((cartItem) => {
      const stock = stockMap.get(cartItem.bookId.toString());
      if (!stock) {
        throw new BadRequestException(`Stock not found for book: ${cartItem.bookId.toString()}`);
      }
      if (!stock.price || stock.price <= 0) {
        throw new BadRequestException(`Invalid price for book: ${cartItem.bookId.toString()}`);
      }
      const unitPrice = stock.price;
      const subtotal = unitPrice * cartItem.quantity;

      return {
        bookId: cartItem.bookId,
        quantity: cartItem.quantity,
        unitPrice,
        subtotal,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    let promotionId: Types.ObjectId | undefined;
    let discountAmount = 0;

    if (createDto.promotionCode) {
      const promotion = await this.promotionModel
        .findOne({ code: createDto.promotionCode.trim().toUpperCase() })
        .lean();
      if (!promotion) {
        throw new NotFoundException('Promotion code not found');
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
      if (promotion.usedByUsers && promotion.usedByUsers.some((id) => id.toString() === currentUser)) {
        throw new BadRequestException('You have already used this promotion');
      }
      if (totalAmount < promotion.minOrderValue) {
        throw new BadRequestException(`Minimum order value for this promotion is ${promotion.minOrderValue}`);
      }
      if (promotion.discountType === 'PERCENT') {
        discountAmount = Math.floor((totalAmount * promotion.discountValue) / 100);
        if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
          discountAmount = promotion.maxDiscount;
        }
      } else if (promotion.discountType === 'FIXED') {
        discountAmount = promotion.discountValue;
      }
      promotionId = promotion._id;
    }

    const finalAmount = totalAmount - discountAmount;

    if (finalAmount < 0) {
      throw new BadRequestException('Invalid final amount');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const stockCollection = this.connection.db?.collection('stocks');
      if (!stockCollection) {
        throw new BadRequestException('Database connection error');
      }
      for (const item of items) {
        const stock = await stockCollection.findOne({ bookId: new Types.ObjectId(item.bookId as any) }, { session });
        if (!stock) {
          throw new BadRequestException(`Stock not found for book ${item.bookId.toString()}`);
        }
        if (stock.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for book ${item.bookId.toString()}. Available: ${stock.quantity}`,
          );
        }
        const result = await stockCollection.updateOne(
          { bookId: new Types.ObjectId(item.bookId as any) },
          { $inc: { quantity: -item.quantity } },
          { session },
        );

        if (result.matchedCount === 0) {
          throw new BadRequestException(`Failed to update stock for book ${item.bookId.toString()}`);
        }
      }

      const lastOrder = await this.orderModel.findOne().sort({ createdAt: -1 }).session(session).lean();
      let orderCode = 'ORD20250001';

      if (lastOrder && lastOrder.orderCode) {
        const lastNumber = parseInt(lastOrder.orderCode.replace('ORD', ''));
        const nextNumber = lastNumber + 1;
        orderCode = `ORD${nextNumber.toString().padStart(8, '0')}`;
      }

      const [newOrder] = await this.orderModel.create(
        [
          {
            orderCode,
            userId: orderUserId,
            items,
            status: 'PENDING',
            totalAmount,
            discountAmount,
            finalAmount,
            promotionId,
            shippingAddress: createDto.shippingAddress,
            paymentMethod: createDto.paymentMethod,
            paymentStatus: 'UNPAID',
            note: createDto.note,
          },
        ],
        { session },
      );

      if (promotionId) {
        const promotionResult = await this.promotionModel.findByIdAndUpdate(
          promotionId,
          {
            $inc: { usedCount: 1 },
            $addToSet: { usedByUsers: orderUserId },
          },
          { session },
        );

        if (!promotionResult) {
          throw new BadRequestException('Failed to update promotion');
        }
        const promotionData = await this.promotionModel.findById(promotionId).session(session).lean();
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
              discountAmount,
              finalAmount,
              totalAmount,
            },
            note: `Customer applied promotion ${promotionData.code} for order ${orderCode}`,
          });
        }
      }
      await this.cartModel.deleteMany(
        {
          _id: { $in: createDto.selectedCartItemIds.map((id) => new Types.ObjectId(id)) },
        },
        { session },
      );
      await session.commitTransaction();
      const order = await this.orderModel
        .findById(newOrder._id)
        .populate('userId', 'firstName lastName email phone')
        .populate('promotionId', 'code name discountType discountValue')
        .lean();
      return ApiResponse.success(order, 'Order created from cart successfully');
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
