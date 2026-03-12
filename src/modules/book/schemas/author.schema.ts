import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuthorDocument = HydratedDocument<Author>;

@Schema({ timestamps: true })
export class Author {
  /**
   * Tên thật của tác giả
   * VD: Nguyễn Nhật Ánh
   */
  @Prop({ required: true, trim: true })
  name: string;

  /**
   * Slug duy nhất cho tác giả, dùng cho URL, SEO
   * VD: nguyen-nhat-anh
   */
  @Prop({ required: true, unique: true, lowercase: true, index: true })
  slug: string;

  /**
   * Bút danh (nếu có)
   */
  @Prop()
  penName?: string;

  /**
   * Tiểu sử, mô tả về tác giả
   */
  @Prop()
  bio?: string;

  /**
   * Ảnh đại diện tác giả
   */
  @Prop()
  avatar?: string;

  /**
   * Quốc tịch
   */
  @Prop()
  nationality?: string;

  /**
   * Ngày sinh
   */
  @Prop()
  birthDate?: Date;

  /**
   * Ngày mất (nếu có)
   */
  @Prop()
  deathDate?: Date;

  /**
   * Số lượng sách đã xuất bản của tác giả
   */
  @Prop({ default: 0 })
  bookCount: number;

  /**
   * Các thể loại sách mà tác giả viết
   */
  @Prop({ type: [String], default: [] })
  genres: string[];
  /**
   * Trạng thái của tác giả: draft (mới tạo), active (đang hoạt động), inactive (ngưng hoạt động), banned (bị cấm)
   */
  @Prop({
    type: String,
    enum: ['draft', 'active', 'inactive', 'banned'],
    default: 'draft',
    index: true,
  })
  status: 'draft' | 'active' | 'inactive' | 'banned';

  /**
   * Đã xác thực thông tin tác giả hay chưa
   */
  @Prop({ default: false })
  isVerified: boolean;

  // ========== Audit ==========
  /**
   * Người tạo bản ghi tác giả (tham chiếu User)
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  /**
   * Người cập nhật bản ghi tác giả (tham chiếu User)
   */
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}
  
/**
 * Tạo schema mongoose cho Author
 */
export const AuthorSchema = SchemaFactory.createForClass(Author);
