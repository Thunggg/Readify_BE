import { HttpException, Inject, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';
import { ErrorResponse } from 'src/shared/responses/error.response';

type CloudinaryV2 = typeof cloudinary;

// Service xử lý upload và quản lý file trên Cloudinary
@Injectable()
export class CloudinaryService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: CloudinaryV2) {}

  // Upload buffer (dữ liệu nhị phân) lên Cloudinary và trả về URL cùng public ID
  async uploadBuffer(params: {
    buffer: Buffer; // Dữ liệu file dưới dạng buffer
    folder?: string; // Thư mục lưu trên Cloudinary (tùy chọn)
    resourceType?: 'image' | 'video' | 'raw'; // Loại tài nguyên, mặc định là 'image'
    filename?: string; // Tên file tùy chỉnh (tùy chọn)
  }): Promise<{ url: string; publicId: string }> {
    const { buffer, folder, resourceType = 'image', filename } = params;

    // Trả về Promise để xử lý upload bất đồng bộ
    return new Promise((resolve, reject) => {
      // Tạo stream upload với các tùy chọn cấu hình
      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder, // Lưu vào thư mục chỉ định
          resource_type: resourceType, // Loại tài nguyên (image/video/raw)
          filename_override: filename, // Ghi đè tên file nếu có
          use_filename: true, // Sử dụng tên file gốc nếu không override
          unique_filename: true, // Tạo tên file duy nhất để tránh trùng lặp
        },
        (err, result) => {
          // Nếu có lỗi upload, từ chối Promise với HttpException
          if (err) {
            return reject(new HttpException(new ErrorResponse('Upload failed', 'UPLOAD_FAILED', 500), 500));
          }

          // Nếu thành công, resolve với URL bảo mật và public ID
          resolve({
            url: result!.secure_url, // URL HTTPS của file đã upload
            publicId: result!.public_id, // ID công khai để tham chiếu file
          });
        },
      );

      // Kết thúc stream với buffer dữ liệu
      stream.end(buffer);
    });
  }

  // Xóa file trên Cloudinary dựa trên public ID
  async destroy(publicId: string): Promise<void> {
    // Gọi API destroy của Cloudinary để xóa file
    await this.cloudinary.uploader.destroy(publicId);
  }
}
