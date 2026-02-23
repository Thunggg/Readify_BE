import { IsNotEmpty, IsOptional, IsString, IsInt, IsMongoId, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsMongoId()
  @IsNotEmpty({ message: 'Book ID is required' })
  bookId: string;

  @IsOptional()
  @IsMongoId()
  orderId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1 star' })
  @Max(5, { message: 'Rating must be at most 5 stars' })
  @IsNotEmpty({ message: 'Rating is required' })
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Comment must be less than 2000 characters' })
  comment?: string;
}

