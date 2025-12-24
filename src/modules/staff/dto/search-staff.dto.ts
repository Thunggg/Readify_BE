import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchStaffDto {
  // ===== ENUMS (INLINE) =====
  static AccountRole = {
    USER: 0,
    ADMIN: 1,
    SELLER: 2,
    WAREHOUSE: 3,
  } as const;

  static AccountStatus = {
    INACTIVE: 0,
    ACTIVE: 1,
    BANNED: -1,
    NOT_ACTIVE_EMAIL: 2,
  } as const;

  static StaffSortBy = {
    CREATED_AT: 'createdAt',
    EMAIL: 'email',
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    LAST_LOGIN_AT: 'lastLoginAt',
  } as const;

  static SortOrder = {
    ASC: 'asc',
    DESC: 'desc',
  } as const;

  // ===== SEARCH =====
  @IsOptional()
  @IsString()
  q?: string; // firstName / lastName / email / phone

  // ===== FILTER =====
  @IsOptional()
  @Type(() => Number)
  @IsEnum(SearchStaffDto.AccountStatus)
  status?: (typeof SearchStaffDto.AccountStatus)[keyof typeof SearchStaffDto.AccountStatus];

  @IsOptional()
  @Type(() => Number)
  @IsEnum(SearchStaffDto.AccountRole)
  role?: (typeof SearchStaffDto.AccountRole)[keyof typeof SearchStaffDto.AccountRole];
  // chỉ dùng 1 | 2 | 3 ở service

  // ===== SORT =====
  @IsOptional()
  @IsEnum(SearchStaffDto.StaffSortBy)
  sortBy: (typeof SearchStaffDto.StaffSortBy)[keyof typeof SearchStaffDto.StaffSortBy] =
    SearchStaffDto.StaffSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SearchStaffDto.SortOrder)
  order: (typeof SearchStaffDto.SortOrder)[keyof typeof SearchStaffDto.SortOrder] =
    SearchStaffDto.SortOrder.DESC;

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
}
