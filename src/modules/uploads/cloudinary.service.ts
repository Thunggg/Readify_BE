import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from 'src/shared/responses/api-response';

export const UploadType = {
  USER_AVATAR: 'user_avatar',
  BOOK_AVATAR: 'book_avatar',
} as const;

export type UploadTypeValue = (typeof UploadType)[keyof typeof UploadType];

const FOLDER_MAP: Record<UploadTypeValue, string> = {
  user_avatar: 'avatar_user',
  book_avatar: 'avatar_book',
};

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });
  }

  async uploadImage(file: Express.Multer.File, type: UploadTypeValue) {
    if (!file) throw new HttpException(ApiResponse.error('File is required', 'FILE_REQUIRED', 400), 400);

    if (!file.mimetype.startsWith('image/'))
      throw new HttpException(ApiResponse.error('File is not an image', 'FILE_NOT_AN_IMAGE', 400), 400);

    return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: FOLDER_MAP[type],
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result)
            reject(new HttpException(ApiResponse.error('Failed to upload image', 'FAILED_TO_UPLOAD_IMAGE', 500), 500));
          resolve({ url: result?.secure_url ?? '', public_id: result?.public_id ?? '' });
        },
      );

      stream.end(file.buffer);
    });
  }
}
