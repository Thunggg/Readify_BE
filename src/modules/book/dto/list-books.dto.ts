import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum BookSortBy {
  TITLE = 'title',
  AUTHOR = 'author',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PUBLISHED_DATE = 'publishedDate',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListBooksDto {
  // ===== SEARCH =====
  @IsOptional()
  @IsString()
  q?: string; // Search in title, author, description

  // ===== FILTER =====
  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  categoryId?: string; // Filter by category

  // ===== SORT =====
  @IsOptional()
  @IsEnum(BookSortBy)
  sortBy: BookSortBy = BookSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.DESC;

  // ===== PAGINATION =====
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

