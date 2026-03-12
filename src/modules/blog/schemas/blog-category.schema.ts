import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type BlogCategoryDocument = HydratedDocument<BlogCategory>;

@Schema({ timestamps: true })
export class BlogCategory {
  /**
   * Tên danh mục (bắt buộc)
   */
  @Prop({ required: true })
  name: string;

  /**
   * Đường dẫn thân thiện (slug) duy nhất cho danh mục (bắt buộc, duy nhất)
   */
  @Prop({ required: true, unique: true })
  slug: string;

  /**
   * Mô tả về danh mục (không bắt buộc)
   */
  @Prop()
  description: string;

  /**
   * Biểu tượng đại diện cho danh mục (không bắt buộc)
   */
  @Prop()
  icon: string;

  /**
   * Số lượng bài viết thuộc danh mục này (mặc định 0)
   */
  @Prop({ default: 0 })
  postCount: number;

  /**
   * Thời điểm bài viết bị xóa mềm (soft delete). Nếu null nghĩa là chưa bị xóa.
   */
  @Prop({ default: null })
  deletedAt?: Date;
}

export const BlogCategorySchema = SchemaFactory.createForClass(BlogCategory);
