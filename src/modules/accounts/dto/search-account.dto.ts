import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountRole, AccountStatus, SortOrder, StaffSortBy } from 'src/modules/staff/constants/staff.enum';
import type {
  AccountRoleValue,
  AccountStatusValue,
  SortOrderValue,
  StaffSortByValue,
} from 'src/modules/staff/constants/staff.enum';

export class SearchAccountDto {
  // ===== SEARCH =====
  @IsOptional()
  @IsString()
  q?: string;

  // ===== FILTER =====
  @IsOptional()
  @Type(() => Number)
  @IsEnum(AccountStatus)
  status?: AccountStatusValue;

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
