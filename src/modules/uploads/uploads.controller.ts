import { Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, UploadType, type UploadTypeValue } from './cloudinary.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // POST /uploads/image?type=user_avatar|book_avatar
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Query('type') type: UploadTypeValue) {
    // whitelist type
    if (type !== UploadType.USER_AVATAR && type !== UploadType.BOOK_AVATAR) {
      return { message: 'Invalid type' };
    }

    return await this.cloudinaryService.uploadImage(file, type);
  }
}
