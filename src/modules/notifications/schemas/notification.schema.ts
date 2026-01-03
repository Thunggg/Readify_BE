import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationType } from '../enums/notification-type.enum';

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
    enum: Object.values(NotificationType),
    default: NotificationType.SYSTEM,
    index: true,
  })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  relatedOrderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Promotion' })
  relatedPromotionId?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>; // Additional data (e.g., orderCode, bookId, etc.)

  @Prop({ default: true })
  isActive: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ isActive: 1, createdAt: -1 });


