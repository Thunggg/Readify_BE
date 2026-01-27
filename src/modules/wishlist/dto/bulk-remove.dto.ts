import { IsArray, IsMongoId } from 'class-validator';

export class BulkRemoveDto {
  @IsArray()
  @IsMongoId({ each: true })
  bookIds: string[];
}
