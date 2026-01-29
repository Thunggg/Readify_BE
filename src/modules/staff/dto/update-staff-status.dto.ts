import { IsInt, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '../constants/staff.enum';
import type { AccountStatusValue } from '../constants/staff.enum';

export class UpdateStaffStatusDto {
  @Type(() => Number)
  @IsEnum(AccountStatus, {
    message: 'Status must be one of: 0 (INACTIVE), 1 (ACTIVE), -1 (BANNED), 2 (NOT_ACTIVE_EMAIL)',
  })
  status: AccountStatusValue;
}
