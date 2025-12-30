import { PartialType } from '@nestjs/mapped-types';
import { CreatePromotionDto } from './create-promotion.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PromotionStatus } from '../constants/promotion.enum';
import type { PromotionStatusValue } from '../constants/promotion.enum';

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatusValue;
}
