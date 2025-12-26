import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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
  @Prop({ type: [String], default: [] })
  authors: string[];

  // Optional
  @Prop({ trim: true })
  language?: string;

  @Prop()
  publishDate?: Date;

  @Prop()
  pageCount?: number;

  // Unique book identity - Mã định danh cho sách
  @Prop({ trim: true, unique: true, sparse: true, index: true })
  isbn?: string;

  // Publisher (NXB)
  @Prop({ type: Types.ObjectId, required: true, index: true })
  publisherId: Types.ObjectId;

  // Categories (many-to-many) -> store ids array for easy filter
  @Prop({ type: [Types.ObjectId], ref: 'Category', default: [], index: true })
  categoryIds: Types.ObjectId[];

  // ===== PRICING =====
  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ min: 0 })
  originalPrice?: number;

  // Optional: currency if you care later
  @Prop({ default: 'VND' })
  currency: string;

  // Media images
  @Prop({
    type: [
      {
        kind: { type: String, enum: ['cover', 'gallery'], required: true },
        mediaId: { type: Types.ObjectId, ref: 'Media', required: true },
        url: { type: String, required: true },
      },
    ],
    default: [],
  })
  images: { kind: 'cover' | 'gallery'; mediaId: Types.ObjectId; url: string }[];

  @Prop({ trim: true })
  thumbnailUrl?: string;

  // number (no enum): 1 active, 0 inactive, 2 hidden, 3 draft, 4 out_of_stock
  @Prop({ default: 1, index: true })
  status: number;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ default: 0, index: true })
  soldCount: number;

  // Ratings summary (if you have ReviewsModule later)
  // @Prop({ default: 0 })
  // ratingAvg: number;

  // @Prop({ default: 0 })
  // ratingCount: number;

  // Tags for quick filtering/search
  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop({ default: 0 })
  stockOnHand?: number;

  @Prop({ default: 0 })
  stockReserved?: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);

// ===== INDEXES =====
BookSchema.index({ isDeleted: 1, status: 1, publisherId: 1, createdAt: -1 });
BookSchema.index({ categoryIds: 1, isDeleted: 1, status: 1, createdAt: -1 });
BookSchema.index({ soldCount: -1, isDeleted: 1, status: 1 });
BookSchema.index({ title: 1 });
BookSchema.index({ authors: 1 });
