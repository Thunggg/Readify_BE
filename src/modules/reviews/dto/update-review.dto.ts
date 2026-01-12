import { IsOptional, IsString, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { ReviewStatus } from '../enums/review-status.enum';

export class UpdateReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Rating must be at least 1 star' })
  @Max(5, { message: 'Rating must be at most 5 stars' })
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Comment must be less than 2000 characters' })
  comment?: string;

  @IsOptional()
  @IsEnum(ReviewStatus, { message: 'Status must be one of: PENDING, APPROVED, REJECTED' })
  status?: ReviewStatus;
}

