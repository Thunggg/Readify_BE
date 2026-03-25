import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../../order/schemas/order.schema';
import { Account, AccountDocument } from '../../accounts/schemas/account.schema';
import {
	IncomeStatisticsDto,
	TopSellingDto,
	RecentOrdersDto,
	GroupBy,
} from '../dto/income-statistics.dto';
import { SuccessResponse } from '../../../shared/responses/success.response';

@Injectable()
export class ViewIncomeService {
	private readonly ALLOWED_ROLES = [1, 2]; // Admin, Seller

	private readonly ZERO_OVERVIEW = { totalRevenue: 0, totalOrders: 0, totalBooks: 0 };

	private readonly ZERO_LAST_MONTH = { totalRevenue: 0, totalOrders: 0 };

	constructor(
		@InjectModel(Order.name)
		private readonly orderModel: Model<OrderDocument>,
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
		const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
		const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

		const range = {
			start: startDate ? new Date(startDate) : defaultStart,
			end: endDate ? new Date(endDate) : defaultEnd,
		};

		if (range.start > range.end) {
			throw new BadRequestException('startDate must be before or equal to endDate');
		}

		return range;
	}

	private getPaidOrderMatch(dateRange?: { start: Date; end: Date }) {
		return {
			status: { $ne: 'CANCELLED' },
			paymentStatus: 'PAID',
			...(dateRange ? { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } : {}),
		};
	}

	private getTotalBooksExpr() {
		return {
			$sum: {
				$reduce: {
					input: '$items',
					initialValue: 0,
					in: { $add: ['$$value', '$$this.quantity'] },
				},
			},
		};
	}

	private calcPercentChange(current: number, previous: number) {
		if (previous <= 0) return 0;
		return ((current - previous) / previous) * 100;
	}

	private getGroupByFormat(groupBy: GroupBy) {
		switch (groupBy) {
			case GroupBy.DAY:
				return '%Y-%m-%d';
			case GroupBy.WEEK:
				return '%Y-W%V';
			case GroupBy.MONTH:
				return '%Y-%m';
			case GroupBy.YEAR:
				return '%Y';
			default:
				return '%Y-%m';
		}
	}

	private getCategoryColor(index: number): string {
		const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6b7280'];
		return colors[index % colors.length];
	}

	async getOverviewStats(userId: string) {
		await this.validateAdminAccess(userId);

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

		const currentMonthStats = await this.orderModel.aggregate([
			{
				$match: this.getPaidOrderMatch({
					start: startOfMonth,
					end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
				}),
			},
			{
				$group: {
					_id: null,
					totalRevenue: { $sum: '$finalAmount' },
					totalOrders: { $sum: 1 },
					totalDiscount: { $sum: '$discountAmount' },
					totalBooks: this.getTotalBooksExpr(),
				},
			},
		]);

		const lastMonthStats = await this.orderModel.aggregate([
			{
				$match: this.getPaidOrderMatch({ start: startOfLastMonth, end: endOfLastMonth }),
			},
			{
				$group: {
					_id: null,
					totalRevenue: { $sum: '$finalAmount' },
					totalOrders: { $sum: 1 },
				},
			},
		]);

		const allTimeStats = await this.orderModel.aggregate([
			{
				$match: this.getPaidOrderMatch(),
			},
			{
				$group: {
					_id: null,
					totalRevenue: { $sum: '$finalAmount' },
					totalOrders: { $sum: 1 },
					totalBooks: this.getTotalBooksExpr(),
				},
			},
		]);

		const currentRaw =
			(currentMonthStats[0] as { totalRevenue?: number; totalOrders?: number; totalBooks?: number }) ||
			this.ZERO_OVERVIEW;
		const lastRaw = (lastMonthStats[0] as { totalRevenue?: number; totalOrders?: number }) || this.ZERO_LAST_MONTH;
		const allTimeRaw =
			(allTimeStats[0] as { totalRevenue?: number; totalOrders?: number; totalBooks?: number }) || this.ZERO_OVERVIEW;

		const current = {
			totalRevenue: Number(currentRaw.totalRevenue ?? 0),
			totalOrders: Number(currentRaw.totalOrders ?? 0),
			totalBooks: Number(currentRaw.totalBooks ?? 0),
		};
		const last = {
			totalRevenue: Number(lastRaw.totalRevenue ?? 0),
			totalOrders: Number(lastRaw.totalOrders ?? 0),
		};
		const allTime = {
			totalRevenue: Number(allTimeRaw.totalRevenue ?? 0),
			totalOrders: Number(allTimeRaw.totalOrders ?? 0),
			totalBooks: Number(allTimeRaw.totalBooks ?? 0),
		};

		const revenueChange = this.calcPercentChange(current.totalRevenue, last.totalRevenue);
		const ordersChange = this.calcPercentChange(current.totalOrders, last.totalOrders);

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
		const dateFormat = this.getGroupByFormat(groupBy);

		const stats = await this.orderModel.aggregate([
			{
				$match: this.getPaidOrderMatch(dateRange),
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

		const categoryStats = (await this.orderModel.aggregate([
			{
				$match: this.getPaidOrderMatch(dateRange),
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
		])) as Array<{
			categoryId: Types.ObjectId | null;
			name: string;
			totalSales: number;
			totalQuantity: number;
		}>;

		const totalSales = categoryStats.reduce((sum, cat) => sum + Number(cat.totalSales ?? 0), 0);
		const statsWithPercentage = categoryStats.map((cat, index) => ({
			...cat,
			percentage: totalSales > 0 ? Math.round((Number(cat.totalSales ?? 0) / totalSales) * 1000) / 10 : 0,
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

	async getTopSellingBooks(query: TopSellingDto, userId: string) {
		await this.validateAdminAccess(userId);

		const { startDate, endDate, limit = 10 } = query;
		const dateRange = this.getDateRange(startDate, endDate);

		const topBooks = await this.orderModel.aggregate([
			{
				$match: this.getPaidOrderMatch(dateRange),
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
			.find(this.getPaidOrderMatch())
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
			amount: Number(order.finalAmount ?? 0),
			books: Array.isArray(order.items)
				? order.items.reduce((sum: number, item: any) => sum + Number(item?.quantity ?? 0), 0)
				: 0,
			createdAt: order.createdAt,
		}));

		return new SuccessResponse(
			{
				orders,
			},
			'Get recent orders success',
		);
	}
}
