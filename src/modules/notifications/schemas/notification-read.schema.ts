import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationReadDocument = HydratedDocument<NotificationRead>;

@Schema({ timestamps: true })
export class NotificationRead {
  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true })
  notificationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  readAt: Date;
}

export const NotificationReadSchema = SchemaFactory.createForClass(NotificationRead);

// Indexes for performance
NotificationReadSchema.index({ notificationId: 1, userId: 1 }, { unique: true });
NotificationReadSchema.index({ userId: 1, readAt: -1 });
NotificationReadSchema.index({ notificationId: 1 });

