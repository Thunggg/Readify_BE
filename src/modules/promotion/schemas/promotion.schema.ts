import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

/**
 * Promotion / Coupon (mã khuyến mãi)
 * - `code`: mã người dùng nhập khi thanh toán (unique, lưu dạng UPPERCASE để chuẩn hoá)
 * - `discountType`: xác định cách áp dụng `discountValue`
 * - `startDate`..`endDate`: thời gian hiệu lực
 * - `usageLimit`/`usedCount`: giới hạn số lần sử dụng
 * - `isDeleted`: xoá mềm (không xoá hẳn khỏi DB)
 */
@Schema({ timestamps: true, collection: 'promotions' })
export class Promotion {
  /** Mã khuyến mãi người dùng nhập (unique, tự trim và chuyển sang uppercase) */
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  code: string;

  /** Tên chương trình (dùng cho admin / hiển thị nội bộ) */
  @Prop({ required: true, trim: true })
  name: string;

  /** Mô tả (tuỳ chọn) */
  @Prop({ trim: true })
  description?: string;

  /** Loại giảm giá: PERCENT (% theo tổng đơn) hoặc FIXED (giảm số tiền cố định) */
  @Prop({ required: true, enum: ['PERCENT', 'FIXED'] })
  discountType: string;

  /**
   * Giá trị giảm:
   * - PERCENT: giá trị % (vd: 10 nghĩa là 10%)
   * - FIXED: số tiền giảm (vd: 50000 nghĩa là giảm 50k)
   */
  @Prop({ required: true, min: 0 })
  discountValue: number;

  /** Giá trị đơn hàng tối thiểu để áp dụng mã */
  @Prop({ default: 0, min: 0 })
  minOrderValue: number;

  /** Mức giảm tối đa (hữu ích cho mã theo %) */
  @Prop({ default: null, min: 0 })
  maxDiscount?: number;

  /** Thời gian bắt đầu có hiệu lực */
  @Prop({ required: true })
  startDate: Date;

  /** Thời gian kết thúc/ hết hiệu lực */
  @Prop({ required: true })
  endDate: Date;

  /** Tổng số lượt được phép sử dụng (tuỳ chọn) */
  @Prop({ default: null, min: 0 })
  usageLimit?: number;

  /** Số lần đã được sử dụng */
  @Prop({ default: 0, min: 0 })
  usedCount: number;

  /** Trạng thái do admin quản lý (có thể tự suy ra EXPIRED theo thời gian, nhưng lưu để tiện) */
  @Prop({ default: 'INACTIVE', enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'] })
  status: string;
  //danh dau user da su dung ma nay
  @Prop({ type: [Types.ObjectId], ref: 'Account', default: [] })
  usedByUsers: Types.ObjectId[];

  /** Phạm vi áp dụng (hiện tại chỉ có ORDER) */
  @Prop({ default: 'ORDER', enum: ['ORDER'] })
  applyScope: string;

  /** Audit: ai tạo (Account _id) */
  @Prop({ type: Types.ObjectId, ref: 'Account' })
  createdBy: Types.ObjectId;

  /** Audit: ai cập nhật lần cuối (Account _id) */
  @Prop({ type: Types.ObjectId, ref: 'Account' })
  updatedBy?: Types.ObjectId;

  /** Cờ xoá mềm (giữ record nhưng ẩn khỏi query bình thường) */
  @Prop({ default: false })
  isDeleted: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);

// Index tra cứu nhanh theo code (đã chuẩn hoá uppercase)
PromotionSchema.index({ code: 1 });
// Index lọc theo trạng thái (admin UI / job)
PromotionSchema.index({ status: 1 });
// Index theo khoảng thời gian: hỗ trợ query kiểu "promo đang active tại thời điểm T"
PromotionSchema.index({ startDate: 1, endDate: 1 });
// Index phục vụ sort theo thời gian tạo (mới nhất trước)
PromotionSchema.index({ createdAt: -1 });
