import { Body, Controller, Delete, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadMediaDto } from './dto/upload-media.dto';
import { Types } from 'mongoose';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('media')
@UseGuards(JwtAuthGuard)
@ApiTags('Media')
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadMediaDto, @Req() req: any) {
    const userId = req.user.userId ?? '';
    return this.mediaService.uploadAvatar(file, dto, userId as string);
  }

  @Post('upload/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const userId = req.user.userId ?? '';
    return this.mediaService.uploadAvatar(file, userId as string);
  }

  @Post('upload/book')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBook(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const userId = req.user.userId ?? '';
    return this.mediaService.uploadBookImage(file, userId as string);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.mediaService.remove(id, userId as string);
  }
}
