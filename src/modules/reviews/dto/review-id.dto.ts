import { IsMongoId } from 'class-validator';

export class ReviewIdDto {
  @IsMongoId({ message: 'Invalid review ID format' })
  id: string;
}

