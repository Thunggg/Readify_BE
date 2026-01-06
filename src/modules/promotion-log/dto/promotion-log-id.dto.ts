import { IsMongoId } from 'class-validator';

export class PromotionLogIdDto {
  @IsMongoId()
  id: string;
}
