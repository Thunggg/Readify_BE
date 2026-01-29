import { BadRequestException, ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { MediaFolder, MediaStatus, MediaType } from './enum/media.enum';
import { Media, MediaDocument, MediaSchema } from './schemas/media.schema';
import { Account } from '../accounts/schemas/account.schema';

// Service quản lý media (hình ảnh, video, file) trong hệ thống, tích hợp với Cloudinary
@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // Ánh xạ loại media (MediaType) sang resource type của Cloudinary
  private mapTypeToResourceType(type: MediaType): 'image' | 'video' | 'raw' {
    if (type === MediaType.VIDEO) return 'video'; // Video
    if (type === MediaType.FILE) return 'raw'; // File khác (raw)
    return 'image'; // Mặc định là image
  }

  // Upload avatar cho tài khoản, lưu lên Cloudinary và cập nhật avatarUrl của account
  async uploadAvatar(file: Express.Multer.File, dto: UploadMediaDto, uploadedBy?: string) {
    try {
      // Kiểm tra file có buffer không (đảm bảo file đã được upload)
      if (!file?.buffer) throw new BadRequestException('Missing file buffer');

      // Xác định loại media, mặc định là IMAGE
      const type = dto.type ?? MediaType.IMAGE;

      // Upload file lên Cloudinary
      const uploaded = await this.cloudinaryService.uploadBuffer({
        buffer: file.buffer, // Dữ liệu file
        folder: dto.folder, // Thư mục trên Cloudinary
        resourceType: this.mapTypeToResourceType(type), // Loại resource (image/video/raw)
        filename: file.originalname, // Tên file gốc
      });

      // Tạo document media trong database với trạng thái TEMP (tạm thời)
      const doc = await this.mediaModel.create({
        url: uploaded.url, // URL từ Cloudinary
        publicId: uploaded.publicId, // Public ID để quản lý trên Cloudinary
        type, // Loại media
        status: MediaStatus.TEMP, // Trạng thái tạm thời, có thể bị xóa bởi cron job
        uploadedBy: uploadedBy ? new Types.ObjectId(uploadedBy) : undefined, // Người upload
        folder: dto.folder as MediaFolder, // Thư mục
        originalName: file.originalname, // Tên file gốc
        mimeType: file.mimetype, // Loại MIME
        size: file.size, // Kích thước file
      });

      // Tìm account của người upload và cập nhật avatarUrl
      const account = await this.accountModel.findById(uploadedBy);

      if (account) {
        account.avatarUrl = doc.url; // Cập nhật URL avatar
        await account.save(); // Lưu thay đổi
      }

      // Trả về response thành công
      return new SuccessResponse(doc, 'Media uploaded successfully', HttpStatus.CREATED);
    } catch (error) {
      // Nếu có lỗi, throw BadRequestException với message từ error
      throw new BadRequestException(error.message);
    }
  }

  // Xóa media theo ID, kiểm tra quyền sở hữu và xóa trên Cloudinary
  async remove(mediaId: string, userId?: string) {
    // Tìm media theo ID
    const media = await this.mediaModel.findById(mediaId);
    if (!media) throw new NotFoundException('Media not found');

    // Kiểm tra quyền sở hữu (tùy chọn): chỉ người upload mới được xóa
    if (userId && media.uploadedBy && String(media.uploadedBy) !== userId) {
      throw new ForbiddenException('You do not own this media');
    }

    // Xóa file trên Cloudinary trước (best effort: cố gắng xóa, không throw error nếu thất bại)
    await this.cloudinaryService.destroy(media.publicId);

    // Xóa document trong database
    await this.mediaModel.deleteOne({ _id: media._id });
    // Trả về response thành công
    return new SuccessResponse(null, 'Media deleted successfully', HttpStatus.OK);
  }

  // Dọn dẹp media tạm thời (TEMP) cũ hơn số giờ chỉ định, được gọi bởi cron job
  async cleanupTempOlderThan(hours: number) {
    // Tính thời điểm cutoff: thời gian hiện tại trừ đi số giờ
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Tìm tất cả media TEMP cũ hơn cutoff, chỉ lấy publicId
    const temps = await this.mediaModel
      .find({ status: MediaStatus.TEMP, createdAt: { $lt: cutoff } })
      .select({ publicId: 1 })
      .lean();

    // Xóa từng file trên Cloudinary (best effort: không throw error nếu thất bại)
    for (const t of temps) {
      try {
        await this.cloudinaryService.destroy(t.publicId);
      } catch {
        console.log('error'); // Log lỗi nhưng không dừng quá trình
      }
    }

    // Xóa tất cả document TEMP cũ hơn cutoff trong database
    const res = await this.mediaModel.deleteMany({
      status: MediaStatus.TEMP,
      createdAt: { $lt: cutoff },
    });

    // Trả về số lượng đã xóa
    return new SuccessResponse(res.deletedCount ?? 0, 'Media deleted successfully', HttpStatus.OK);
  }
}
