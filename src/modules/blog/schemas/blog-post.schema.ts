import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Account } from '../../accounts/schemas/account.schema';
import { Book } from '../../book/schemas/book.schema';

export type BlogPostDocument = HydratedDocument<BlogPost>;

@Schema({ timestamps: true })
export class BlogPost {
  /**
   * Tiêu đề bài viết (bắt buộc)
   */
  @Prop({ required: true })
  title: string;

  /**
   * Đường dẫn thân thiện (slug) duy nhất cho bài viết (bắt buộc, duy nhất)
   */
  @Prop({ required: true, unique: true })
  slug: string;

  /**
   * Nội dung chính của bài viết (bắt buộc)
   */
  @Prop({ required: true })
  content: string;

  /**
   * Tóm tắt nội dung bài viết (không bắt buộc)
   */
  @Prop()
  excerpt: string;

  /**
   * Ảnh đại diện cho bài viết (không bắt buộc)
   */
  @Prop()
  featuredImage: string;

  /**
   * Tham chiếu đến sách liên quan (nếu có)
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Book' })
  book: Types.ObjectId;

  /**
   * Tham chiếu đến danh mục blog (bắt buộc)
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'BlogCategory', required: true })
  category: Types.ObjectId;

  /**
   * Tham chiếu đến tác giả (bắt buộc)
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Account', required: true })
  author: Types.ObjectId;

  /**
   * Trạng thái bài viết: draft (nháp), published (đã xuất bản), archived (lưu trữ). Mặc định là draft
   */
  @Prop({ default: 'draft', enum: ['draft', 'published', 'archived'] })
  status: string;

  /**
   * Số lượt xem bài viết (mặc định 0)
   */
  @Prop({ default: 0 })
  viewCount: number;

  /**
   * Danh sách các thẻ (tags) của bài viết
   */
  @Prop({ type: [{ type: String }] })
  tags: string[];

  /**
   * Số lượng bình luận (mặc định 0)
   */
  @Prop({ default: 0 })
  commentCount: number;

  /**
   * Ngày xuất bản bài viết (nếu có)
   */
  @Prop({ type: Date })
  publishedAt: Date;

  /**
   * Thời điểm bài viết bị xóa mềm (soft delete). Nếu null nghĩa là chưa bị xóa.
   */
  @Prop({ default: null })
  deletedAt?: Date;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);

BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1 });
BlogPostSchema.index({ tags: 1 });
