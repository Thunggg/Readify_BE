import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchAdminBooksDto {
  // SEARCH
  @IsOptional()
  @IsString()
  q?: string; // title / isbn / author

  // FILTER
  @IsOptional()
  @IsString()
  publisherId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  status?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDeleted?: boolean;

  // SORT
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'basePrice' | 'soldCount';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  // PAGINATION
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
