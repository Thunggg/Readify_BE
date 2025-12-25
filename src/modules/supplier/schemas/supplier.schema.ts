import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ trim: true, required: true })
  name: string;

  @Prop({ trim: true })
  contactName?: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Book' }], default: [] })
  bookIds?: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
