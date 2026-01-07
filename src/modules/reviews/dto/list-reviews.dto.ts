import { IsEnum, IsInt, IsOptional, IsMongoId, IsBoolean, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReviewStatus } from '../enums/review-status.enum';

export enum ReviewSortBy {
  CREATED_AT = 'createdAt',
  RATING = 'rating',
  HELPFUL_COUNT = 'helpfulCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListReviewsDto {
  @IsOptional()
  @IsMongoId()
  bookId?: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy = ReviewSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}

