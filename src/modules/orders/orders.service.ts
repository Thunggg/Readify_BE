import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Order, OrderDocument, PaymentMethod, PaymentStatus, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { VnpayCallbackDto } from './dto/vnpay-callback.dto';
import { ApiResponse } from 'src/shared/responses/api-response';
import { ErrorResponse } from 'src/shared/responses/error.response';
import { VnpayUtil, VnpayConfig } from 'src/shared/utils/vnpay';
import { Book, BookDocument } from '../book/schemas/book.mongoose.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'userId', message: 'Invalid user ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate and calculate totals
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of dto.items) {
      // Validate bookId
      if (!Types.ObjectId.isValid(item.bookId)) {
        throw new HttpException(
          ErrorResponse.validationError([{ field: 'items', message: `Invalid book ID: ${item.bookId}` }]),
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get book info
      const book = await this.bookModel.findById(item.bookId).lean();
      if (!book || book.isDeleted) {
        throw new HttpException(
          ErrorResponse.notFound(`Book not found: ${item.bookId}`),
          HttpStatus.NOT_FOUND,
        );
      }

      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        bookId: new Types.ObjectId(item.bookId),
        quantity: item.quantity,
        price: item.price,
        title: book.title,
      });
    }

    const finalAmount = totalAmount + dto.shippingFee;

    // Create order
    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      items: orderItems,
      totalAmount,
      shippingFee: dto.shippingFee,
      finalAmount,
      paymentMethod: dto.paymentMethod,
      paymentStatus: dto.paymentMethod === PaymentMethod.COD ? PaymentStatus.PENDING : PaymentStatus.PENDING,
      status: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      note: dto.note,
      isDeleted: false,
    });

    const orderData = order.toObject();

    // Handle payment based on method
    if (dto.paymentMethod === PaymentMethod.COD) {
      // COD: Order created, waiting for confirmation
      return ApiResponse.success(
        {
          order: orderData,
          payment: {
            method: PaymentMethod.COD,
            status: PaymentStatus.PENDING,
            message: 'Đơn hàng đã được tạo. Bạn sẽ thanh toán khi nhận hàng.',
          },
        },
        'Tạo đơn hàng COD thành công',
        201,
      );
    } else if (dto.paymentMethod === PaymentMethod.VNPAY) {
      // VNPay: Create payment URL
      const paymentUrl = await this.createVnpayPaymentUrl(order._id.toString(), finalAmount, orderData);

      return ApiResponse.success(
        {
          order: orderData,
          payment: {
            method: PaymentMethod.VNPAY,
            status: PaymentStatus.PENDING,
            paymentUrl,
            message: 'Vui lòng thanh toán qua VNPay',
          },
        },
        'Tạo đơn hàng VNPay thành công',
        201,
      );
    }

    throw new HttpException(
      ErrorResponse.validationError([{ field: 'paymentMethod', message: 'Invalid payment method' }]),
      HttpStatus.BAD_REQUEST,
    );
  }

  async createVnpayPaymentUrl(orderId: string, amount: number, orderData: any): Promise<string> {
    const vnpayConfig: VnpayConfig = {
      tmnCode: this.configService.get<string>('vnpay.tmnCode') as string,
      secretKey: this.configService.get<string>('vnpay.secretKey') as string,
      returnUrl: this.configService.get<string>('vnpay.returnUrl') as string,
      ipnUrl: this.configService.get<string>('vnpay.ipnUrl') as string,
      url: this.configService.get<string>('vnpay.url') as string,
    };

    if (!vnpayConfig.tmnCode || !vnpayConfig.secretKey) {
      throw new HttpException(
        ErrorResponse.internal('VNPay configuration is missing'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const now = new Date();
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.tmnCode,
      vnp_Amount: amount,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: vnpayConfig.returnUrl,
      vnp_IpAddr: '127.0.0.1', // Should get from request in production
      vnp_CreateDate: VnpayUtil.formatDate(now),
      vnp_ExpireDate: VnpayUtil.formatDate(expireDate),
    };

    return VnpayUtil.createPaymentUrl(params, vnpayConfig);
  }

  async handleVnpayCallback(query: VnpayCallbackDto, clientIp: string) {
    const vnpayConfig: VnpayConfig = {
      tmnCode: this.configService.get<string>('vnpay.tmnCode') as string,
      secretKey: this.configService.get<string>('vnpay.secretKey') as string,
      returnUrl: this.configService.get<string>('vnpay.returnUrl') as string,
      ipnUrl: this.configService.get<string>('vnpay.ipnUrl') as string,
      url: this.configService.get<string>('vnpay.url') as string,
    };

    // Convert query to object for verification
    const callbackData: Record<string, any> = {
      vnp_Amount: query.vnp_Amount,
      vnp_BankCode: query.vnp_BankCode,
      vnp_BankTranNo: query.vnp_BankTranNo,
      vnp_CardType: query.vnp_CardType,
      vnp_OrderInfo: query.vnp_OrderInfo,
      vnp_PayDate: query.vnp_PayDate,
      vnp_ResponseCode: query.vnp_ResponseCode,
      vnp_TmnCode: query.vnp_TmnCode,
      vnp_TransactionNo: query.vnp_TransactionNo,
      vnp_TransactionStatus: query.vnp_TransactionStatus,
      vnp_TxnRef: query.vnp_TxnRef,
      vnp_SecureHash: query.vnp_SecureHash,
    };

    // Verify secure hash
    const isValid = VnpayUtil.verifyCallback(callbackData, vnpayConfig.secretKey);

    if (!isValid) {
      throw new HttpException(
        ErrorResponse.badRequest('Invalid VNPay callback signature'),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Get order ID from vnp_TxnRef
    const orderId = query.vnp_TxnRef;

    if (!Types.ObjectId.isValid(orderId)) {
      throw new HttpException(
        ErrorResponse.validationError([{ field: 'vnp_TxnRef', message: 'Invalid order ID' }]),
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find order
    const order = await this.orderModel.findById(orderId);

    if (!order || order.isDeleted) {
      throw new HttpException(
        ErrorResponse.notFound('Order not found'),
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if already processed
    if (order.paymentStatus === PaymentStatus.PAID) {
      return ApiResponse.success(
        {
          orderId: order._id.toString(),
          status: 'already_paid',
          message: 'Order already paid',
        },
        'Đơn hàng đã được thanh toán',
        200,
      );
    }

    // Process payment based on response code
    const responseCode = query.vnp_ResponseCode;
    const transactionStatus = query.vnp_TransactionStatus;

    if (responseCode === '00' && transactionStatus === '00') {
      // Payment successful
      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.CONFIRMED;
      order.vnpayTransactionId = query.vnp_TransactionNo;
      order.vnpayOrderId = query.vnp_TxnRef;
      order.vnpayPaymentDate = VnpayUtil.parseDate(query.vnp_PayDate);

      await order.save();

      return ApiResponse.success(
        {
          orderId: order._id.toString(),
          status: 'success',
          message: 'Payment successful',
          transactionId: query.vnp_TransactionNo,
        },
        'Thanh toán thành công',
        200,
      );
    } else {
      // Payment failed
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();

      return ApiResponse.error(
        'Thanh toán thất bại',
        'PAYMENT_FAILED',
        400,
        [
          {
            field: 'vnp_ResponseCode',
            message: `Payment failed with code: ${responseCode}`,
          },
        ],
      );
    }
  }
}

