import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MediaDocument = HydratedDocument<Media>;

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
}

export enum MediaStatus {
  TEMP = 'TEMP',
  ATTACHED = 'ATTACHED',
}

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

  @Prop({
    type: {
      model: { type: String },
      id: { type: Types.ObjectId },
    },
    _id: false,
  })
  @Prop()
  originalName?: string;

  @Prop()
  mimeType?: string;

  // timestamps fields
  @Prop()
  createdAt: Date;
  updatedAt: Date;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ status: 1, createdAt: 1 });
MediaSchema.index({ 'attachedTo.model': 1, 'attachedTo.id': 1 });
