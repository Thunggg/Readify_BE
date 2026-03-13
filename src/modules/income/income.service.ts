/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Order, OrderDocument } from '../order/schemas/order.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import {
  IncomeStatisticsDto,
  TopSellingDto,
  RecentOrdersDto,
  ExportIncomeDto,
  GroupBy,
} from './dto/income-statistics.dto';
import { SuccessResponse } from '../../shared/responses/success.response';

@Injectable()
export class IncomeService {
  private readonly ALLOWED_ROLES = [1, 2]; // Admin, Seller

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  private async validateAdminAccess(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.accountModel.findById(userId).select('role').lean();
    if (!user || !this.ALLOWED_ROLES.includes(user.role)) {
      throw new ForbiddenException('Access denied');
    }
  }

  private getDateRange(startDate?: string, endDate?: string) {
    const now = new Date();
    // Default: last 6 months
    const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      start: startDate ? new Date(startDate) : defaultStart,
      end: endDate ? new Date(endDate) : defaultEnd,
    };
  }

  private getGroupByFormat(groupBy: GroupBy) {
    switch (groupBy) {
      case GroupBy.DAY:
        return {
          dateFormat: '%Y-%m-%d',
          sortFormat: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        };
      case GroupBy.WEEK:
        return {
          dateFormat: '%Y-W%V',
          sortFormat: { $dateToString: { format: '%Y-%V', date: '$createdAt' } },
        };
      case GroupBy.MONTH:
        return {
          dateFormat: '%Y-%m',
          sortFormat: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        };
      case GroupBy.YEAR:
        return {
          dateFormat: '%Y',
          sortFormat: { $dateToString: { format: '%Y', date: '$createdAt' } },
        };
      default:
        return {
          dateFormat: '%Y-%m',
          sortFormat: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        };
    }
  }

  async getOverviewStats(userId: string) {
    await this.validateAdminAccess(userId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Current month stats
    const currentMonthStats = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalOrders: { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
          totalBooks: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] },
              },
            },
          },
        },
      },
    ]);

    // Last month stats for comparison
    const lastMonthStats = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // All time stats
    const allTimeStats = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalOrders: { $sum: 1 },
          totalBooks: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] },
              },
            },
          },
        },
      },
    ]);

    const current = currentMonthStats[0] || { totalRevenue: 0, totalOrders: 0, totalBooks: 0 };
    const last = lastMonthStats[0] || { totalRevenue: 0, totalOrders: 0 };
    const allTime = allTimeStats[0] || { totalRevenue: 0, totalOrders: 0, totalBooks: 0 };

    // Calculate percentage changes
    const revenueChange =
      last.totalRevenue > 0 ? ((current.totalRevenue - last.totalRevenue) / last.totalRevenue) * 100 : 0;
    const ordersChange = last.totalOrders > 0 ? ((current.totalOrders - last.totalOrders) / last.totalOrders) * 100 : 0;

    return new SuccessResponse(
      {
        currentMonth: {
          revenue: current.totalRevenue,
          orders: current.totalOrders,
          books: current.totalBooks,
        },
        allTime: {
          revenue: allTime.totalRevenue,
          orders: allTime.totalOrders,
          books: allTime.totalBooks,
        },
        changes: {
          revenue: Math.round(revenueChange * 10) / 10,
          orders: Math.round(ordersChange * 10) / 10,
        },
      },
      'Get overview statistics success',
    );
  }

  async getIncomeStatistics(query: IncomeStatisticsDto, userId: string) {
    await this.validateAdminAccess(userId);

    const { startDate, endDate, groupBy = GroupBy.MONTH } = query;
    const dateRange = this.getDateRange(startDate, endDate);
    const { dateFormat } = this.getGroupByFormat(groupBy);

    const stats = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
          profit: { $sum: '$finalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          orders: 1,
          profit: 1,
        },
      },
    ]);

    return new SuccessResponse(
      {
        statistics: stats,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
        groupBy,
      },
      'Get income statistics success',
    );
  }

  async getCategoryStatistics(query: IncomeStatisticsDto, userId: string) {
    await this.validateAdminAccess(userId);

    const { startDate, endDate } = query;
    const dateRange = this.getDateRange(startDate, endDate);

    // Get completed orders with book details
    const categoryStats = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'books',
          localField: 'items.bookId',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      { $unwind: { path: '$book.categoryIds', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'book.categoryIds',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            categoryId: '$category._id',
            orderId: '$_id',
            bookId: '$items.bookId',
          },
          name: { $first: '$category.name' },
          subtotal: { $first: '$items.subtotal' },
          quantity: { $first: '$items.quantity' },
        },
      },
      {
        $group: {
          _id: '$_id.categoryId',
          name: { $first: '$name' },
          totalSales: { $sum: '$subtotal' },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: { $ifNull: ['$name', 'Uncategorized'] },
          totalSales: 1,
          totalQuantity: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    // Calculate percentages
    const totalSales = categoryStats.reduce((sum, cat) => sum + cat.totalSales, 0);
    const statsWithPercentage = categoryStats.map((cat, index) => ({
      ...cat,
      percentage: totalSales > 0 ? Math.round((cat.totalSales / totalSales) * 1000) / 10 : 0,
      color: this.getCategoryColor(index),
    }));

    return new SuccessResponse(
      {
        categories: statsWithPercentage,
        total: totalSales,
      },
      'Get category statistics success',
    );
  }

  private getCategoryColor(index: number): string {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6b7280'];
    return colors[index % colors.length];
  }

  async getTopSellingBooks(query: TopSellingDto, userId: string) {
    await this.validateAdminAccess(userId);

    const { startDate, endDate, limit = 10 } = query;
    const dateRange = this.getDateRange(startDate, endDate);

    const topBooks = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.bookId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      {
        $project: {
          _id: 0,
          bookId: '$_id',
          title: '$book.title',
          thumbnailUrl: '$book.thumbnailUrl',
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return new SuccessResponse(
      {
        books: topBooks,
      },
      'Get top selling books success',
    );
  }

  async getRecentOrders(query: RecentOrdersDto, userId: string) {
    await this.validateAdminAccess(userId);

    const { limit = 10 } = query;

    const recentOrders = await this.orderModel
      .find({ status: { $ne: 'CANCELLED' }, paymentStatus: 'PAID' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .lean();

    const orders = recentOrders.map((order: any) => ({
      _id: order._id,
      orderCode: order.orderCode,
      customer: order.userId
        ? `${(order.userId as any).firstName || ''} ${(order.userId as any).lastName || ''}`.trim()
        : 'Unknown',
      amount: order.finalAmount,
      books: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      createdAt: order.createdAt,
    }));

    return new SuccessResponse(
      {
        orders,
      },
      'Get recent orders success',
    );
  }

  async exportIncome(query: ExportIncomeDto, userId: string) {
    await this.validateAdminAccess(userId);

    const { startDate, endDate, groupBy = GroupBy.DAY } = query;
    const dateRange = this.getDateRange(startDate, endDate);
    const { dateFormat } = this.getGroupByFormat(groupBy);

    // Get detailed statistics for export
    const stats = await this.orderModel.aggregate([
      {
        $match: {
          status: { $ne: 'CANCELLED' },
          paymentStatus: 'PAID',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          totalAmount: { $sum: '$totalAmount' },
          discountAmount: { $sum: '$discountAmount' },
          orders: { $sum: 1 },
          booksSold: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] },
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          revenue: 1,
          totalAmount: 1,
          discountAmount: 1,
          orders: 1,
          booksSold: 1,
        },
      },
    ]);

    // Calculate totals
    const totals = stats.reduce(
      (acc, item) => ({
        revenue: acc.revenue + item.revenue,
        totalAmount: acc.totalAmount + item.totalAmount,
        discountAmount: acc.discountAmount + item.discountAmount,
        orders: acc.orders + item.orders,
        booksSold: acc.booksSold + item.booksSold,
      }),
      { revenue: 0, totalAmount: 0, discountAmount: 0, orders: 0, booksSold: 0 },
    );

    return new SuccessResponse(
      {
        data: stats,
        totals,
        exportInfo: {
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString(),
          },
          groupBy,
          exportedAt: new Date().toISOString(),
        },
      },
      'Export income data success',
    );
  }
}
