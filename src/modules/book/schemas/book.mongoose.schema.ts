import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true, trim: true, index: true })
  title: string;

  @Prop({ trim: true })
  author?: string;

  @Prop({ trim: true, unique: true, sparse: true, index: true })
  isbn?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categories?: Types.ObjectId[];

  @Prop()
  publishedDate?: Date;

  @Prop({ trim: true })
  coverUrl?: string;

  @Prop()
  pages?: number;

  @Prop({ trim: true })
  publisher?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const BookSchema = SchemaFactory.createForClass(Book);

// Indexes for better query performance
BookSchema.index({ title: 1, isDeleted: 1 });
BookSchema.index({ author: 1, isDeleted: 1 });
BookSchema.index({ isbn: 1, isDeleted: 1 });
BookSchema.index({ isDeleted: 1 });
BookSchema.index({ title: 'text', author: 'text', description: 'text' }); // Text search index

