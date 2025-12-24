import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus, AccountRole, StaffSortBy, SortOrder } from '../constants/staff.enum';
import type { AccountStatusValue, AccountRoleValue, StaffSortByValue, SortOrderValue } from '../constants/staff.enum';

export class SearchStaffDto {
  // ===== SEARCH =====
  @IsOptional()
  @IsString()
  q?: string;

  // ===== FILTER =====
  @IsOptional()
  @Type(() => Number)
  @IsEnum(AccountStatus)
  status?: AccountStatusValue;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(AccountRole)
  role?: AccountRoleValue;
  // service sẽ chặn role = 0

  // ===== SORT =====
  @IsOptional()
  @IsEnum(StaffSortBy)
  sortBy: StaffSortByValue = StaffSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrderValue = SortOrder.DESC;

  // ===== PAGINATION =====
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

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDeleted?: boolean;
}
