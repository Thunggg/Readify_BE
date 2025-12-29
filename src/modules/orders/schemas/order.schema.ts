import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Account } from '../../accounts/schemas/account.schema';
import { Book } from '../../book/schemas/book.mongoose.schema';

export type OrderDocument = HydratedDocument<Order>;

export enum PaymentMethod {
  COD = 'COD', // Cash on Delivery
  VNPAY = 'VNPAY',
}

export enum OrderStatus {
  PENDING = 'pending', // Chờ xử lý
  CONFIRMED = 'confirmed', // Đã xác nhận
  PROCESSING = 'processing', // Đang xử lý
  SHIPPING = 'shipping', // Đang giao hàng
  DELIVERED = 'delivered', // Đã giao hàng
  CANCELLED = 'cancelled', // Đã hủy
  REFUNDED = 'refunded', // Đã hoàn tiền
}

export enum PaymentStatus {
  PENDING = 'pending', // Chờ thanh toán
  PAID = 'paid', // Đã thanh toán
  FAILED = 'failed', // Thanh toán thất bại
  REFUNDED = 'refunded', // Đã hoàn tiền
}

export interface OrderItem {
  bookId: Types.ObjectId;
  quantity: number;
  price: number; // Giá tại thời điểm đặt hàng
  title?: string; // Lưu tên sách để reference
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city?: string;
  district?: string;
  ward?: string;
  note?: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: Account.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [{ bookId: Types.ObjectId, quantity: Number, price: Number, title: String }], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number; // Tổng tiền hàng

  @Prop({ default: 0 })
  shippingFee: number; // Phí vận chuyển

  @Prop({ required: true })
  finalAmount: number; // Tổng tiền phải trả (totalAmount + shippingFee)

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
    index: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true,
  })
  paymentStatus: PaymentStatus;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @Prop({ type: Object, required: true })
  shippingAddress: ShippingAddress;

  // VNPay specific fields
  @Prop({ trim: true })
  vnpayTransactionId?: string; // VNPay transaction ID

  @Prop({ trim: true })
  vnpayOrderId?: string; // VNPay order ID (orderId trong VNPay)

  @Prop()
  vnpayPaymentDate?: Date; // Thời gian VNPay xác nhận thanh toán

  // COD specific fields
  @Prop()
  codReceivedDate?: Date; // Thời gian nhận tiền COD

  @Prop({ trim: true })
  note?: string; // Ghi chú đơn hàng

  @Prop({ default: false })
  isDeleted: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes for better query performance
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ vnpayTransactionId: 1 });
OrderSchema.index({ vnpayOrderId: 1 });

