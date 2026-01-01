import { PartialType } from '@nestjs/mapped-types';
import { CreatePromotionDto } from './create-promotion.dto';
import { IsIn, IsOptional } from 'class-validator';
import { PromotionStatus } from '../constants/promotion.enum';
import type { PromotionStatusValue } from '../constants/promotion.enum';

export class UpdatePromotionDto extends PartialType(CreatePromotionDto) {
  // Client/Admin is NOT allowed to set EXPIRED manually.
  // EXPIRED should be derived by the system when endDate < now.
  @IsOptional()
  @IsIn([PromotionStatus.ACTIVE, PromotionStatus.INACTIVE])
  status?: Exclude<PromotionStatusValue, typeof PromotionStatus.EXPIRED>;
}
