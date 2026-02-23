import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionStatus, DiscountType, ApplyScope, PromotionSortBy, SortOrder } from '../constants/promotion.enum';
import type {
  PromotionStatusValue,
  DiscountTypeValue,
  ApplyScopeValue,
  PromotionSortByValue,
  SortOrderValue,
} from '../constants/promotion.enum';

export class SearchPromotionDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatusValue;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountTypeValue;

  @IsOptional()
  @IsEnum(ApplyScope)
  applyScope?: ApplyScopeValue;

  @IsOptional()
  @IsEnum(PromotionSortBy)
  sortBy: PromotionSortByValue = PromotionSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrderValue = SortOrder.DESC;

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
