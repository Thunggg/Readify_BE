import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { AttachMediaDto } from './dto/attach-media.dto';
import { ListMyMediaDto } from './dto/list-my-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { Media, MediaDocument, MediaStatus, MediaType } from './schemas/media.schema';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<Media>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private mapTypeToResourceType(type: MediaType): 'image' | 'video' | 'raw' {
    if (type === MediaType.VIDEO) return 'video';
    if (type === MediaType.FILE) return 'raw';
    return 'image';
  }

  async uploadOne(params: { file: Express.Multer.File; dto: UploadMediaDto; uploadedBy?: string }) {
    const { file, dto, uploadedBy } = params;

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
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    return {
      _id: doc._id,
      url: doc.url,
      publicId: doc.publicId,
      type: doc.type,
      status: doc.status,
      createdAt: doc.createdAt,
    };
  }

  async attach(dto: AttachMediaDto, userId?: string) {
    const media = await this.mediaModel.findById(dto.mediaId);
    if (!media) throw new NotFoundException('Media not found');

    // ownership check
    if (userId && media.uploadedBy && String(media.uploadedBy) !== userId) {
      throw new ForbiddenException('You do not own this media');
    }

    if (media.status === MediaStatus.ATTACHED) {
      throw new BadRequestException('Media already attached');
    }

    media.status = MediaStatus.ATTACHED;
    media.attachedTo = {
      model: dto.model,
      id: new Types.ObjectId(dto.id),
    };

    await media.save();
    return { success: true };
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
    return { success: true };
  }

  async listMine(userId: string, q: ListMyMediaDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { uploadedBy: new Types.ObjectId(userId) };
    if (q.status) filter.status = q.status;
    if (q.type) filter.type = q.type;
    if (q.attachedModel) filter['attachedTo.model'] = q.attachedModel;

    const [items, total] = await Promise.all([
      this.mediaModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.mediaModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
        // ignore
      }
    }

    const res = await this.mediaModel.deleteMany({
      status: MediaStatus.TEMP,
      createdAt: { $lt: cutoff },
    });

    return { deleted: res.deletedCount ?? 0 };
  }
}
