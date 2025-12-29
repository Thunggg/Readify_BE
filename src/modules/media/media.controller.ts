import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachMediaDto } from './dto/attach-media.dto';
import { ListMyMediaDto } from './dto/list-my-media.dto';
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

  @Patch('attach')
  async attach(@Body() dto: AttachMediaDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.mediaService.attach(dto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return this.mediaService.remove(id, userId);
  }

  @Get('my')
  async my(@Query() q: ListMyMediaDto, @Req() req: any) {
    const userId = req.user.userId;
    return this.mediaService.listMine(userId, q);
  }
}
