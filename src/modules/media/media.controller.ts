import { Body, Controller, Delete, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadMediaDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.mediaService.uploadOne({ file, dto, uploadedBy: userId });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.mediaService.remove(id, userId as string);
  }
}
