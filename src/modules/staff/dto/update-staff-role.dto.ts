import { IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStaffRoleDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2, 3]) // 1 admin, 2 seller, 3 warehouse
  role: number;
}
