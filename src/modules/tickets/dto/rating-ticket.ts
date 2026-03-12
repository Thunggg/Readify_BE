import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class RatingTicketDto {
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1 star' })
  @Max(5, { message: 'Rating must be at most 5 stars' })
  @IsNotEmpty({ message: 'Rating is required' })
  rating: number;

  @IsString({ message: 'Comment must be a string' })
  @IsOptional({ message: 'Comment is optional' })
  @MaxLength(2000, { message: 'Comment must be less than 2000 characters long' })
  comment?: string;
}
