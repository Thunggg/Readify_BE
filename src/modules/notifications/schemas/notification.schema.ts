import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({
    type: String,
    enum: ['ORDER', 'PROMOTION', 'SYSTEM', 'ACCOUNT', 'OTHER'],
    default: 'SYSTEM',
    index: true,
  })
  type: string;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  relatedOrderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Promotion' })
  relatedPromotionId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ isActive: 1, createdAt: -1 });


