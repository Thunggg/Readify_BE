import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentLog, PaymentLogDocument } from './schemas/payment-log.schema';
import { PaginatedResponse } from 'src/shared/responses/paginated.response';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { ErrorResponse } from 'src/shared/responses/error.response';

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
    status?: string;
    paymentMethod?: string;
    page?: number;
    limit?: number;
  }) {
    const { userId, orderCode, status, paymentMethod, page = 1, limit = 10 } = query;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    // BUILD MATCH STAGE
    const match: any = {};
    if (userId) {
      if (Types.ObjectId.isValid(userId)) {
        match.userId = new Types.ObjectId(userId);
      }
    }
    if (status) {
      match.status = status;
    }
    if (paymentMethod) {
      match.paymentMethod = paymentMethod;
    }

    // AGGREGATION PIPELINE
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
      {
        $lookup: {
          from: 'accounts',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    // SEARCH BY ORDER CODE
    if (orderCode?.trim()) {
      pipeline.push({
        $match: {
          'order.orderCode': { $regex: orderCode.trim(), $options: 'i' },
        },
      });
    }

    // PROJECT STAGE
    pipeline.push({
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
    });

    // SORT, SKIP, LIMIT
    pipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: validLimit });

    // EXECUTE
    const [items, totalResult] = await Promise.all([
      this.paymentLogModel.aggregate(pipeline).exec(),
      // Accurate count requires matching base and potentially $lookup if we filter by orderCode
      this.getAccurateCount(match, orderCode),
    ]);

    return new PaginatedResponse(
      items,
      {
        page: validPage,
        limit: validLimit,
        total: totalResult,
      },
      'Successfully retrieved payment logs',
    );
  }

  private async getAccurateCount(match: any, orderCode?: string) {
    if (!orderCode?.trim()) {
      return this.paymentLogModel.countDocuments(match);
    }
    
    // If filtering by orderCode, need a small pipeline to count
    const countPipeline = [
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
      { $count: 'total' },
    ];
    const result = await this.paymentLogModel.aggregate(countPipeline).exec();
    return result[0]?.total || 0;
  }
}
