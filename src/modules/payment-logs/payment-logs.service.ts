import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentLog, PaymentLogDocument } from './schemas/payment-log.schema';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';

@Injectable()
export class PaymentLogsService {
  constructor(
    @InjectModel(PaymentLog.name)
    private readonly paymentLogModel: Model<PaymentLogDocument>,
  ) {}

  async logPayment(data: Partial<PaymentLog>) {
    const log = await this.paymentLogModel.create(data);
    return log.toObject();
  }

  async getAdminPaymentLogsList(query: {
    userId?: string;
    orderCode?: string;
    /** Payment log status: PENDING | PAID | FAILED | CANCELLED */
    status?: string;
    /** Current order status on linked order: PENDING | CONFIRMED | DELIVERED | COMPLETED | CANCELLED */
    orderStatus?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, orderCode, status, orderStatus, paymentMethod, page = 1, limit = 10 } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    if (orderStatus?.trim()) {
      return this.getListOrderCentric(
        {
          userId,
          orderCode,
          status,
          orderStatus: orderStatus.trim(),
          paymentMethod,
        },
        validPage,
        validLimit,
        skip,
      );
    }

    return this.getListPaymentLogCentric(
      {
        userId,
        orderCode,
        status,
        paymentMethod,
      },
      validPage,
      validLimit,
      skip,
    );
  }

  /** Một dòng = một đơn (theo orderStatus); join log mới nhất — luôn hiện dù chưa có payment_logs */
  private async getListOrderCentric(
    q: {
      userId?: string;
      orderCode?: string;
      status?: string;
      orderStatus: string;
      paymentMethod?: string;
    },
    validPage: number,
    validLimit: number,
    skip: number,
  ) {
    const ordersColl = this.paymentLogModel.db.collection('orders');

    const orderMatch: Record<string, unknown> = { status: q.orderStatus };
    if (q.userId && Types.ObjectId.isValid(q.userId)) {
      orderMatch.userId = new Types.ObjectId(q.userId);
    }
    if (q.paymentMethod) {
      orderMatch.paymentMethod = q.paymentMethod;
    }
    if (q.orderCode?.trim()) {
      orderMatch.orderCode = { $regex: q.orderCode.trim(), $options: 'i' };
    }

    const pipeline: any[] = [
      { $match: orderMatch },
      {
        $lookup: {
          from: 'payment_logs',
          let: { oid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$orderId', '$$oid'] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'logArr',
        },
      },
      {
        $addFields: {
          paymentLog: { $arrayElemAt: ['$logArr', 0] },
        },
      },
    ];

    if (q.status) {
      pipeline.push({
        $addFields: {
          effectivePaymentStatus: {
            $ifNull: ['$paymentLog.status', 'PENDING'],
          },
        },
      });
      pipeline.push({
        $match: { effectivePaymentStatus: q.status },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'accounts',
          localField: 'userId',
          foreignField: '_id',
          as: 'userArr',
        },
      },
      { $unwind: '$userArr' },
      {
        $project: {
          _id: { $ifNull: ['$paymentLog._id', '$_id'] },
          userId: 1,
          orderId: '$_id',
          status: { $ifNull: ['$paymentLog.status', 'PENDING'] },
          paymentMethod: { $ifNull: ['$paymentLog.paymentMethod', '$paymentMethod'] },
          amount: { $ifNull: ['$paymentLog.amount', '$finalAmount'] },
          currency: { $ifNull: ['$paymentLog.currency', 'VND'] },
          metadata: {
            $cond: {
              if: { $ne: ['$paymentLog', null] },
              then: { $ifNull: ['$paymentLog.metadata', {}] },
              else: {
                orderCode: '$orderCode',
                syntheticFromOrder: true,
              },
            },
          },
          createdAt: {
            $ifNull: ['$paymentLog.createdAt', '$updatedAt'],
          },
          order: {
            orderCode: '$orderCode',
            status: '$status',
          },
          user: {
            email: '$userArr.email',
            firstName: '$userArr.firstName',
            lastName: '$userArr.lastName',
          },
        },
      },
      { $sort: { createdAt: -1 } },
    );

    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: validLimit }];

    const [items, countAgg] = await Promise.all([
      ordersColl.aggregate(dataPipeline).toArray(),
      ordersColl.aggregate(countPipeline).toArray(),
    ]);

    const total = countAgg[0]?.total ?? 0;

    return new PaginatedResponse(items, { page: validPage, limit: validLimit, total }, 'Successfully retrieved payment logs');
  }

  /** Danh sách theo từng dòng payment_logs (khi không lọc theo trạng thái đơn) */
  private async getListPaymentLogCentric(
    q: {
      userId?: string;
      orderCode?: string;
      status?: string;
      paymentMethod?: string;
    },
    validPage: number,
    validLimit: number,
    skip: number,
  ) {
    const match: Record<string, unknown> = {};
    if (q.userId && Types.ObjectId.isValid(q.userId)) {
      match.userId = new Types.ObjectId(q.userId);
    }
    if (q.status) {
      match.status = q.status;
    }
    if (q.paymentMethod) {
      match.paymentMethod = q.paymentMethod;
    }

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
    ];

    if (q.orderCode?.trim()) {
      pipeline.push({
        $match: {
          'order.orderCode': { $regex: q.orderCode.trim(), $options: 'i' },
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'accounts',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          userId: 1,
          orderId: 1,
          status: 1,
          paymentMethod: 1,
          amount: 1,
          currency: 1,
          metadata: 1,
          createdAt: 1,
          'order.orderCode': 1,
          'order.status': 1,
          'user.email': 1,
          'user.firstName': 1,
          'user.lastName': 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: validLimit },
    );

    const total = await this.getPaymentLogCentricCount(match, q.orderCode);

    const items = await this.paymentLogModel.aggregate(pipeline).exec();

    return new PaginatedResponse(items, { page: validPage, limit: validLimit, total }, 'Successfully retrieved payment logs');
  }

  private async getPaymentLogCentricCount(match: Record<string, unknown>, orderCode?: string) {
    if (!orderCode?.trim()) {
      return this.paymentLogModel.countDocuments(match);
    }

    const countPipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      {
        $match: {
          'order.orderCode': { $regex: orderCode.trim(), $options: 'i' },
        },
      },
      {
        $lookup: {
          from: 'accounts',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $count: 'total' },
    ];

    const result = await this.paymentLogModel.aggregate(countPipeline).exec();
    return result[0]?.total || 0;
  }
}
