import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StockDocument = HydratedDocument<Stock>;

@Schema({ timestamps: true })
export class Stock {
  @Prop({ type: Types.ObjectId, ref: 'Book', required: true, index: true })
  bookId: Types.ObjectId;

  @Prop({ default: 0 })
  quantity: number;

  @Prop()
  location?: string;

  @Prop()
  price?: number;

  @Prop()
  batch?: string;

  @Prop()
  lastUpdated?: Date;

  @Prop({ default: 'available' })
  status?: string;
}

export const StockSchema = SchemaFactory.createForClass(Stock);
