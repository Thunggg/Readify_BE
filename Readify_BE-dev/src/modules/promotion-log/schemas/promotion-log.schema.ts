import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromotionLogDocument = HydratedDocument<PromotionLog>;

@Schema({ timestamps: true, collection: 'promotion_logs' })
export class PromotionLog {
  @Prop({ type: Types.ObjectId, ref: 'Promotion', required: true })
  promotionId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  promotionCode: string;

  @Prop({ required: true, trim: true })
  promotionName: string;

  @Prop({ required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'APPLY'] })
  action: string;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  performedBy: Types.ObjectId;

  @Prop({ type: Object })
  oldData?: Record<string, any>;

  @Prop({ type: Object })
  newData?: Record<string, any>;

  @Prop({ type: Object })
  changes?: Record<string, any>;

  @Prop({ trim: true })
  note?: string;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;
}

export const PromotionLogSchema = SchemaFactory.createForClass(PromotionLog);

PromotionLogSchema.index({ promotionId: 1, createdAt: -1 });
PromotionLogSchema.index({ performedBy: 1, createdAt: -1 });
PromotionLogSchema.index({ action: 1, createdAt: -1 });
PromotionLogSchema.index({ promotionCode: 1 });
