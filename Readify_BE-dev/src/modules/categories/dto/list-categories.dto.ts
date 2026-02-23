import { IsEnum, IsInt, IsOptional, IsString, Max, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export enum CategorySortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListCategoriesDto {
  // ===== SEARCH =====
  @IsOptional()
  @IsString()
  q?: string; // Search in name and description

  // ===== FILTER =====
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1], { message: 'status must be 0 or 1' })
  status?: number | string; // accept string from query

  // ===== SORT =====
  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy: CategorySortBy = CategorySortBy.CREATED_AT;

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

