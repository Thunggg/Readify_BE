import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type BlogCommentDocument = HydratedDocument<BlogComment>;

@Schema({ timestamps: true })
export class BlogComment {
  /**
   * Tham chiếu đến bài viết blog mà bình luận này thuộc về (bắt buộc)
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'BlogPost', required: true })
  post: Types.ObjectId;

  /**
   * Tham chiếu đến tài khoản người dùng (nếu có, có thể là khách)
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Account' })
  user: Types.ObjectId;

  /**
   * Nội dung bình luận (bắt buộc)
   */
  @Prop({ required: true })
  content: string;

  /**
   * Tham chiếu đến bình luận cha (nếu là trả lời cho bình luận khác)
   */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'BlogComment' })
  parent: Types.ObjectId;

  /**
   * Trạng thái bình luận: pending (chờ duyệt), approved (đã duyệt), spam, rejected. Mặc định là pending
   */
  @Prop({
    default: 'pending',
    enum: ['pending', 'approved', 'spam', 'rejected'],
  })
  status: string;

  /**
   * Danh sách các bình luận trả lời cho bình luận này
   */
  @Prop({ type: [{ type: SchemaTypes.ObjectId, ref: 'BlogComment' }] })
  replies: Types.ObjectId[];

  /**
   * Số lượt thích bình luận (mặc định 0)
   */
  @Prop({ default: 0 })
  likeCount: number;

  /**
   * Thời điểm bài viết bị xóa mềm (soft delete). Nếu null nghĩa là chưa bị xóa.
   */
  @Prop({ default: null })
  deletedAt?: Date;
}

export const BlogCommentSchema = SchemaFactory.createForClass(BlogComment);
