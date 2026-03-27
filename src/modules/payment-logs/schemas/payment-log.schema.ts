import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentLogDocument = HydratedDocument<PaymentLog>;

@Schema({ timestamps: true, collection: 'payment_logs' })
export class PaymentLog {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
    index: true,
  })
  status: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'VND' })
  currency: string;

  @Prop({ type: Object, default: {} })
  metadata?: {
    bankReference?: string;
    transactionId?: string;
    bankCode?: string;
    vnp_ResponseCode?: string;
    vnp_TransactionStatus?: string;
    [key: string]: any;
  };

  @Prop()
  ipAddress?: string;

  @Prop()
  failureReason?: string;
}

export const PaymentLogSchema = SchemaFactory.createForClass(PaymentLog);

// Indexes
PaymentLogSchema.index({ status: 1, createdAt: -1 });
PaymentLogSchema.index({ 'metadata.transactionId': 1 }, { sparse: true });
PaymentLogSchema.index({ 'metadata.bankReference': 1 }, { sparse: true });
