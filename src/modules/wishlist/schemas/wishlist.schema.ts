import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WishlistDocument = HydratedDocument<Wishlist>;

@Schema({ timestamps: true })
export class Wishlist {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Stock', required: true })
  stockId: Types.ObjectId;
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);

// Create compound index to ensure one user can't have duplicate books in wishlist
WishlistSchema.index({ userId: 1, bookId: 1 }, { unique: true });
