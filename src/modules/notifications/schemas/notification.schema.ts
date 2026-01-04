import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Account } from '../../accounts/schemas/account.schema';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  ORDER = 'order',
  STOCK = 'stock',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  ACCOUNT = 'account',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: Account.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    default: NotificationType.SYSTEM,
    index: true,
  })
  type: NotificationType;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>; // Additional data (e.g., orderId, bookId, etc.)

  @Prop({ default: false })
  isDeleted: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

