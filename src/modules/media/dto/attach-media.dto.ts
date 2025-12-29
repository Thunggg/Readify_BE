import { Type } from 'class-transformer';
import { IsMongoId, IsString } from 'class-validator';

export class AttachMediaDto {
  @IsMongoId()
  mediaId: string;

  @IsString()
  model: string; // 'Book' | 'Banner' ...

  @IsMongoId()
  @Type(() => String)
  id: string; // entity id
}
