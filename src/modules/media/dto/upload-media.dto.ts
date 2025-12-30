import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MediaType } from '../schemas/media.schema';

export class UploadMediaDto {
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;

  @IsOptional()
  @IsString()
  folder?: string;
}
