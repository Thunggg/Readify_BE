import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

@Schema({ timestamps: true, collection: 'promotions' })
export class Promotion {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, enum: ['PERCENT', 'FIXED'] })
  discountType: string;

  @Prop({ required: true, min: 0 })
  discountValue: number;

  @Prop({ default: 0, min: 0 })
  minOrderValue: number;

  @Prop({ default: null, min: 0 })
  maxDiscount?: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: null, min: 0 })
  usageLimit?: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'] })
  status: string;

  @Prop({ default: 'ORDER', enum: ['ORDER'] })
  applyScope: string;

  @Prop({ type: Types.ObjectId, ref: 'Account' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account' })
  updatedBy?: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

PromotionSchema.index({ code: 1 });
PromotionSchema.index({ status: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });
PromotionSchema.index({ createdAt: -1 });
