import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CollectionDocument = HydratedDocument<Collection>;

@Schema({ timestamps: true })
export class Collection {
  @Prop({ trim: true, required: true })
  name: string;

  @Prop({ trim: true, required: true, lowercase: true, unique: true, index: true })
  slug: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  coverImageUrl?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Book' }], default: [] })
  bookIds: Types.ObjectId[];

  @Prop({ default: 1, index: true })
  status: number;

  @Prop({ default: 0, index: true })
  sortOrder: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);

CollectionSchema.index({ isDeleted: 1, status: 1, sortOrder: 1, createdAt: -1 });
CollectionSchema.index({ name: 1, slug: 1 });
