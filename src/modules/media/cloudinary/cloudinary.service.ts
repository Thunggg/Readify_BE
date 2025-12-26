import { Inject, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';

type CloudinaryV2 = typeof cloudinary;

@Injectable()
export class CloudinaryService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: CloudinaryV2) {}

  async uploadBuffer(params: {
    buffer: Buffer;
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw';
    filename?: string;
  }): Promise<{ url: string; publicId: string }> {
    const { buffer, folder, resourceType = 'image', filename } = params;

    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          filename_override: filename,
          use_filename: true,
          unique_filename: true,
        },
        (err, result) => {
          if (err) {
            const error =
              err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err));
            return reject(error);
          }

          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
          });
        },
      );

      stream.end(buffer);
    });
  }

  async destroy(publicId: string): Promise<void> {
    await this.cloudinary.uploader.destroy(publicId);
  }
}
