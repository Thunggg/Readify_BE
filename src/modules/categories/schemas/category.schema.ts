import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true, unique: true, index: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Indexes for better query performance
CategorySchema.index({ name: 1, isDeleted: 1 });
CategorySchema.index({ isDeleted: 1 });

