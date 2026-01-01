import { IsOptional, IsString, IsEnum, IsDateString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionLogAction, PromotionLogSortBy, SortOrder } from '../constants/promotion-log.enum';

export class SearchPromotionLogDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId()
  promotionId?: string;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsEnum(PromotionLogAction)
  action?: PromotionLogAction;

  @IsOptional()
  @IsMongoId()
  performedBy?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(PromotionLogSortBy)
  sortBy?: PromotionLogSortBy = PromotionLogSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
