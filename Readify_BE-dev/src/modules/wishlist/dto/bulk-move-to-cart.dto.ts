import { IsArray, IsMongoId } from 'class-validator';

export class BulkMoveToCartDto {
  @IsArray()
  @IsMongoId({ each: true })
  bookIds: string[];
}
