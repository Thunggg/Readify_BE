import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', index: true })
  orderId?: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5, index: true })
  rating: number; // 1-5 sao

  @Prop({ trim: true, maxlength: 2000 })
  comment?: string;

  @Prop({
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.PENDING,
    index: true,
  })
  status: ReviewStatus;

  @Prop({ default: 0, min: 0 })
  helpfulCount: number; // Số người đánh giá hữu ích

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes for performance
ReviewSchema.index({ bookId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, bookId: 1 }, { unique: true }); // Một user chỉ đánh giá một lần cho một sách
ReviewSchema.index({ bookId: 1, rating: 1 });
ReviewSchema.index({ isActive: 1, status: 1, createdAt: -1 });

