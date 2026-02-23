import { IsMongoId, IsNotEmpty } from 'class-validator';

export class PromotionIdDto {
  @IsNotEmpty({ message: 'Promotion ID is required' })
  @IsMongoId({ message: 'Invalid promotion ID format' })
  id: string;
}
