import { IsInt, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStaffRole } from '../constants/staff.enum';
import type { AccountStaffRoleValue } from '../constants/staff.enum';

export class UpdateStaffRoleDto {
  @IsInt()
  @IsEnum(AccountStaffRole, {
    message: 'Role must be one of: 1 (ADMIN), 2 (SELLER), 3 (WAREHOUSE)',
  })
  role: AccountStaffRoleValue;
}
