import { IsString, IsEnum, IsNumber, IsDate, IsOptional, Min, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../constants/promotion.enum';
import type { DiscountTypeValue } from '../constants/promotion.enum';

export class CreatePromotionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  code: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountTypeValue;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  usageLimit?: number;
}
