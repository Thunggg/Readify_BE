import { IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStaffStatusDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1, 2]) // 0 inactive, 1 active, 2 not active email
  status: number;
}
