import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type BlogPostLikeDocument = HydratedDocument<BlogPostLike>;

@Schema({ timestamps: true })
export class BlogPostLike {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'BlogPost', required: true, index: true })
  blogPost: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Account', required: true, index: true })
  user: Types.ObjectId;
}

export const BlogPostLikeSchema = SchemaFactory.createForClass(BlogPostLike);

// Ensure a user can like a post only once.
BlogPostLikeSchema.index({ blogPost: 1, user: 1 }, { unique: true });

