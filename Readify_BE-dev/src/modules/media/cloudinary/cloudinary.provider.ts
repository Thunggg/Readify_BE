import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CLOUDINARY = 'CLOUDINARY';

type CloudinaryV2 = typeof cloudinary;

export const cloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService): CloudinaryV2 => {
    cloudinary.config({
      cloud_name: configService.get<string>('cloudinary.cloudName'),
      api_key: configService.get<string>('cloudinary.apiKey'),
      api_secret: configService.get<string>('cloudinary.apiSecret'),
      secure: true,
    });

    return cloudinary;
  },
  inject: [ConfigService],
};
