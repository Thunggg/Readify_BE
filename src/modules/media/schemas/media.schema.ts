import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MediaFolder, MediaStatus, MediaType } from '../enum/media.enum';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ timestamps: true })
export class Media {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true, index: true, unique: true })
  publicId: string;

  @Prop({ enum: Object.values(MediaType), default: MediaType.IMAGE })
  type: MediaType;

  @Prop()
  size?: number;

  @Prop({ enum: Object.values(MediaStatus), default: MediaStatus.TEMP, index: true })
  status: MediaStatus;

  @Prop({ type: Types.ObjectId, ref: 'Account', index: true })
  uploadedBy?: Types.ObjectId;

  @Prop({ enum: Object.values(MediaFolder) })
  folder: MediaFolder;

  @Prop({
    type: {
      model: { type: String },
      id: { type: Types.ObjectId },
    },
    _id: false,
  })
  attachedTo?: {
    model: string; // 'Book' | 'Banner' | 'Account' ...
    id: Types.ObjectId;
  };

  @Prop()
  originalName?: string;

  @Prop()
  mimeType?: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ status: 1, createdAt: 1 });
MediaSchema.index({ 'attachedTo.model': 1, 'attachedTo.id': 1 });
