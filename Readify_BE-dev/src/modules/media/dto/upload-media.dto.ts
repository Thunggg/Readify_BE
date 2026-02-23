import { IsEnum } from 'class-validator';
import { MediaFolder, MediaType } from '../enum/media.enum';

export class UploadMediaDto {
  @IsEnum(MediaType)
  type: MediaType;

  @IsEnum(MediaFolder)
  folder: MediaFolder;
}
