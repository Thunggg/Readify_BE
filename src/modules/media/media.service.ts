import { BadRequestException, ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { SuccessResponse } from 'src/shared/responses/success.response';
import { MediaFolder, MediaStatus, MediaType } from './enum/media.enum';
import { Media, MediaDocument, MediaSchema } from './schemas/media.schema';
import { Account } from '../accounts/schemas/account.schema';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<Account>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private mapTypeToResourceType(type: MediaType): 'image' | 'video' | 'raw' {
    if (type === MediaType.VIDEO) return 'video';
    if (type === MediaType.FILE) return 'raw';
    return 'image';
  }

  async uploadAvatar(file: Express.Multer.File, dto: UploadMediaDto, uploadedBy?: string) {
    try {
      if (!file?.buffer) throw new BadRequestException('Missing file buffer');

      const type = dto.type ?? MediaType.IMAGE;

      const uploaded = await this.cloudinaryService.uploadBuffer({
        buffer: file.buffer,
        folder: dto.folder,
        resourceType: this.mapTypeToResourceType(type),
        filename: file.originalname,
      });

      const doc = await this.mediaModel.create({
        url: uploaded.url,
        publicId: uploaded.publicId,
        type,
        status: MediaStatus.TEMP,
        uploadedBy: uploadedBy ? new Types.ObjectId(uploadedBy) : undefined,
        folder: dto.folder as MediaFolder,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });

      const account = await this.accountModel.findById(uploadedBy);

      if (account) {
        account.avatarUrl = doc.url;
        await account.save();
      }

      return new SuccessResponse(doc, 'Media uploaded successfully', HttpStatus.CREATED);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(mediaId: string, userId?: string) {
    const media = await this.mediaModel.findById(mediaId);
    if (!media) throw new NotFoundException('Media not found');

    // Optional ownership check
    if (userId && media.uploadedBy && String(media.uploadedBy) !== userId) {
      throw new ForbiddenException('You do not own this media');
    }

    // Delete remote first (best effort)
    await this.cloudinaryService.destroy(media.publicId);

    await this.mediaModel.deleteOne({ _id: media._id });
    return new SuccessResponse(null, 'Media deleted successfully', HttpStatus.OK);
  }

  // Used by cron cleanup
  async cleanupTempOlderThan(hours: number) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const temps = await this.mediaModel
      .find({ status: MediaStatus.TEMP, createdAt: { $lt: cutoff } })
      .select({ publicId: 1 })
      .lean();

    // Delete on cloudinary best effort
    for (const t of temps) {
      try {
        await this.cloudinaryService.destroy(t.publicId);
      } catch {
        console.log('error');
      }
    }

    const res = await this.mediaModel.deleteMany({
      status: MediaStatus.TEMP,
      createdAt: { $lt: cutoff },
    });

    return new SuccessResponse(res.deletedCount ?? 0, 'Media deleted successfully', HttpStatus.OK);
  }
}
