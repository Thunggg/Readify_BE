import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BookCurrency, BookLanguage, BookStatus } from '../enums/book.enum';

export type BookDocument = HydratedDocument<Book>;

@Schema({ timestamps: true })
export class Book {
  // ===== BASIC =====
  @Prop({ trim: true, required: true })
  title: string;

  @Prop({ trim: true, required: true, lowercase: true, unique: true, index: true })
  slug: string;

  @Prop({ trim: true })
  subtitle?: string;

  @Prop({ trim: true })
  description?: string;

  // Authors: simple string array is easiest for MVP
  @Prop({ type: [Types.ObjectId], ref: 'Author', default: [], index: true })
  authors: Types.ObjectId[];

  // Optional
  @Prop({
    trim: true,
    enum: Object.values(BookLanguage),
    index: true,
  })
  language?: BookLanguage;

  @Prop()
  publishDate?: Date;

  @Prop()
  pageCount?: number;

  // Unique book identity - Mã định danh cho sách
  @Prop({ trim: true, unique: true, sparse: true, index: true })
  isbn?: string;

  // Publisher (NXB)
  @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true, index: true })
  publisherId: Types.ObjectId;

  // Categories (many-to-many) -> store ids array for easy filter
  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [], index: true })
  categoryIds: Types.ObjectId[];

  // ===== PRICING =====
  @Prop({ required: true, min: 0 })
  basePrice: number;

  // Optional: currency if you care later
  @Prop({
    default: BookCurrency.VND,
    enum: Object.values(BookCurrency),
    index: true,
  })
  currency: BookCurrency;

  // Media images
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Media' }],
    default: [],
  })
  images: Types.ObjectId[];

  @Prop({ trim: true })
  thumbnailUrl?: string;

  // number (no enum): 1 active, 0 inactive, 2 hidden, 3 draft, 4 out_of_stock
  // @Prop({ default: 1, index: true })
  // status: number;

  @Prop({
    default: BookStatus.ACTIVE,
    enum: Object.values(BookStatus).filter((v) => typeof v === 'number'), // Chỉ lấy giá trị number
    index: true,
  })
  status: BookStatus;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop()
  publishedAt?: Date;

  @Prop({ default: 0, index: true })
  soldCount: number;

  // Tags for quick filtering/search
  @Prop({ type: [String], default: [], index: true })
  tags: string[];
}

export const BookSchema = SchemaFactory.createForClass(Book);

// ===== INDEXES =====
BookSchema.index({ isDeleted: 1, status: 1, publisherId: 1, createdAt: -1 });
BookSchema.index({ categoryIds: 1, isDeleted: 1, status: 1, createdAt: -1 });
BookSchema.index({ soldCount: -1, isDeleted: 1, status: 1 });
BookSchema.index({ title: 1 });
BookSchema.index({ authors: 1 });
