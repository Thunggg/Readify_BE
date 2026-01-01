import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ trim: true, required: true })
  name: string;

  // SEO-friendly unique slug
  @Prop({ trim: true, required: true, lowercase: true, unique: true, index: true })
  slug: string;

  // Optional: short description for admin/homepage
  @Prop({ trim: true })
  description?: string;

  // Optional: icon/image for UI
  @Prop({ trim: true })
  iconUrl?: string;

  // Category tree support (optional)
  //   @Prop({ type: Types.ObjectId, ref: 'Category', index: true })
  //   parentId?: Types.ObjectId;

  // Ordering in menu
  @Prop({ default: 0, index: true })
  sortOrder: number;

  // Status number (no enum): 1 active, 0 inactive
  @Prop({ default: 1, index: true })
  status: number;

  // Soft delete
  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ isDeleted: 1, status: 1, sortOrder: 1 });
CategorySchema.index({ parentId: 1, isDeleted: 1, status: 1, sortOrder: 1 });
