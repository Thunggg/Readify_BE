import { IsMongoId } from 'class-validator';

export class CategoryIdDto {
  @IsMongoId({ message: 'Invalid category ID format' })
  id: string;
}

