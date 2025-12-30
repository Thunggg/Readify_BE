import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, unique: true })
  orderCode: string;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({
    required: true,
    enum: ['CREATED', 'PENDING', 'PAID', 'PREPARING', 'DELIVERED', 'RECEIVED', 'CANCELLED'],
    default: 'CREATED',
  })
  status: string;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop({ required: true, min: 0 })
  finalAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'Promotion' })
  promotionId?: Types.ObjectId;

  @Prop({ required: true })
  shippingAddress: string;

  @Prop({
    required: true,
    enum: ['COD', 'VNPAY', 'MOMO'],
    default: 'COD',
  })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: ['UNPAID', 'PAID', 'REFUNDED'],
    default: 'UNPAID',
  })
  paymentStatus: string;

  @Prop()
  note?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ orderCode: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
